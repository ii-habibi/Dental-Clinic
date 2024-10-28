const express = require('express');
const router = express.Router();
const pool = require('../models/db');


// Route to display all appointments
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
         Select
			   appointment.appointment_id, 
                patients.name,
                patients.gender,
                patients.age,
                patients.email,
                patients.phone,
                doctors.name AS doctor_name, 
                appointment.appointment_date, 
                appointment.appointment_time, 
                appointment.treatment_type, 
                appointment.visit_type,
                appointment.status 
            FROM 
                appointment
            JOIN 
                patients ON appointment.patient_id = patients.patient_id
            JOIN 
                doctors ON appointment.doctor_id = doctors.id  
        `);

        const appointments = result.rows;
        
        const doctorsResult = await pool.query(`
            SELECT * FROM doctors
            `)
            const doctors = doctorsResult.rows;

        res.render('admin/appointments', { appointments, doctors });
    } catch (error) {
        console.error('Error fetching appointments:', error.message); // Log error message
        console.error(error.stack); // Log stack trace for debugging
        res.status(500).send('Internal Server Error');
    }
});


// Route to render the appointment booking form
router.get('/book', async (req, res) => {
    try {
        const doctorsResult = await pool.query('SELECT * FROM doctors');
        const doctors = doctorsResult.rows;
        res.render('user/book_appointment', { doctors });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/book', async (req, res) => {
    const { patient_name, patient_gender, patient_age, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, treatment_type, visit_type } = req.body;

    try {
        // Check if the patient exists
        const patientResult = await pool.query('SELECT patient_id FROM patients WHERE email = $1', [patient_email]);

        let patientId;

        if (patientResult.rows.length > 0) {
            // Existing patient
            patientId = patientResult.rows[0].patient_id;

            if (visit_type === 'first') {
                return res.status(400).json({ message: 'This email is already associated with a patient. Select "Return Visit" instead.' });
            }
        } else {
            // New patient - create entry in patients table
            const newPatient = await pool.query(
                'INSERT INTO patients (name, gender, age, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING patient_id',
                [patient_name, patient_gender, patient_age, patient_email, patient_phone]
            );
            patientId = newPatient.rows[0].patient_id;
        }

        // Insert appointment
        await pool.query(
            'INSERT INTO appointment (patient_id, doctor_id, appointment_date, appointment_time, treatment_type, status, visit_type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [patientId, doctor_id, appointment_date, appointment_time || null, treatment_type, 'Pending', visit_type]
        );

        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to handle deleting an Appointment with AJAX
router.delete('/delete/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM appointment WHERE appointment_id = $1', [appointmentId]);

        if (result.rowCount > 0) {
            res.status(200).send({ message: 'Appointment deleted successfully' });
        } else {
            res.status(404).send({ message: 'Appointment not found' });
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
});



module.exports = router;
