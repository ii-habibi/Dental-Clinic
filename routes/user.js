// routes/user.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db'); // Adjust the path as necessary


// Route to display services and blogs on the user side
router.get('/', async (req, res) => {
    try {
        // Fetch services from the database
        const servicesResult = await pool.query('SELECT * FROM Services');
        const services = servicesResult.rows; // Get the rows for services

        // Fetch blogs from the database
        const blogsResult = await pool.query('SELECT * FROM Blog ORDER BY created_at DESC');
        const blogs = blogsResult.rows; // Get the rows for blogs


        // Fetch all doctors from the database
        const doctorResult = await pool.query('SELECT * FROM doctors');
        const doctors = doctorResult.rows


        // Render the home page and pass to the template
        res.render('user/home', { services, blogs, doctors });

    } catch (error) {
        console.error('Error fetching data for user home:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/appointments', async (req, res) => {
    const { patient_name, patient_gender, patient_age, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, treatment_type, notes, visit_type } = req.body;

    try {
        let patientResult;
        let patientId;

        // Check if the patient exists based on provided email or phone
        if (patient_email) {
            patientResult = await pool.query('SELECT * FROM patients WHERE email = $1', [patient_email]);
        } else if (patient_phone) {
            patientResult = await pool.query('SELECT * FROM patients WHERE phone = $1', [patient_phone]);
        }

        if (patientResult && patientResult.rows.length > 0) {
            // Patient with matching email or phone exists
            patientId = patientResult.rows[0].patient_id;

            // If it's a first-time visit, prompt the user to select "Return Visit"
            if (visit_type === 'first') {
                return res.status(400).json({ message: 'This email or phone is already associated with a patient. Select "Return Visit" instead.' });
            }
        } else {
            // New patient - insert data
            const newPatient = await pool.query(
                'INSERT INTO patients (name, gender, age, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING patient_id',
                [patient_name, patient_gender, patient_age || null, patient_email, patient_phone]
            );
            patientId = newPatient.rows[0].patient_id;
        }

        // Insert the new appointment with reference to patient_id
        await pool.query(
            'INSERT INTO appointment (patient_id, doctor_id, appointment_date, appointment_time, treatment_type, status, visit_type, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [patientId, doctor_id, appointment_date || new Date(), appointment_time || null, treatment_type, 'Pending', visit_type, notes]
        );

        // Respond with success message
        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (error) {
        console.error('Error booking appointment:', error);

        // Check for specific error codes and handle accordingly
        if (error.code === '23505') { // Unique constraint violation (e.g., duplicate email or phone)
            res.status(400).json({ message: 'Duplicate entry detected. Patient data already exists.' });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});


module.exports = router;
