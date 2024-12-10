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
                appointment.notes,
                appointment.status 
            FROM 
                appointment
            JOIN 
                patients ON appointment.patient_id = patients.patient_id
            JOIN 
                doctors ON appointment.doctor_id = doctors.id  
            ORDER BY	
				appointment.appointment_id DESC
        `);

        const appointments = result.rows;
        const doctorsResult = await pool.query(`
            SELECT * FROM doctors
            `)
            const doctors = doctorsResult.rows;

        res.render('admin/appointments', { appointments, doctors });
    } catch (error) {
        console.error('Error fetching appointments:', error.message); // Log error message
        console.error(error.stack); // Log s for debging
        res.status(500).send('Internal Server Error');
    }
});

// New AJAX route to get specific appointment details by ID
router.get('/:appointmentId', async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const result = await pool.query(`
            SELECT
                appointment.appointment_id, 
                patients.name AS patient_name,
                patients.gender,
                patients.age,
                patients.email,
                patients.phone,
                doctors.id AS doctor_id,
                doctors.name AS doctor_name, 
                appointment.appointment_date, 
                appointment.appointment_time, 
                appointment.treatment_type, 
                appointment.visit_type,
                appointment.notes,
                appointment.status 
            FROM 
                appointment
            JOIN 
                patients ON appointment.patient_id = patients.patient_id
            JOIN 
                doctors ON appointment.doctor_id = doctors.id
            WHERE 
                appointment.appointment_id = $1  
        `, [appointmentId]);

        const appointment = result.rows[0];

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json({ appointment });
    } catch (error) {
        console.error('Error fetching appointment:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
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

router.post('/', async (req, res) => {
    const { patient_name, patient_gender, patient_age, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, treatment_type, notes, visit_type } = req.body;
 console.log(req.body)
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
                [patient_name, patient_gender, patient_age || null, patient_email || null, patient_phone || null]
            );
            patientId = newPatient.rows[0].patient_id;
        }

        // Insert the new appointment with reference to patient_id
        await pool.query(
            'INSERT INTO appointment (patient_id, doctor_id, appointment_date, appointment_time, treatment_type, status, visit_type, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [patientId, doctor_id, appointment_date || new Date(), appointment_time || null, treatment_type, 'Pending', visit_type, notes]
        );

        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (error) {
        console.error('Error booking appointment:', error);

        if (error.code === '23505') { // Unique constraint violation
            res.status(400).json({ message: 'Duplicate entry detected. Patient data already exists.' });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});


// Route to delete an appointment and possibly patient data
router.delete('/delete/:id', async (req, res) => {
    const appointmentId = req.params.id;
    console.log("server  " + appointmentId)

    try {
        // Get the appointment details including visit type and patnt id
        const result = await pool.query(`
            SELECT patient_id, visit_type 
            FROM appointment 
            WHERE appointment_id = $1
        `, [appointmentId]);

        if (result.rowCount > 0) {
            const { patient_id, visit_type } = result.rows[0];

            await pool.query('BEGIN');

            await pool.query(`DELETE FROM appointment WHERE appointment_id = $1`, [appointmentId]);

            if (visit_type === 'first visit') {
                await pool.query(`DELETE FROM patients WHERE patient_id = $1`, [patient_id]);
            }

            // Commit the transaction
            await pool.query('COMMIT');
            res.status(200).json({ message: 'Appointment deleted successfully' });
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (error) {
        console.error('Error deleting appointment and patient:', error.message);
        await pool.query('ROLLBACK');  
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to update the status of an appointment
// Route to update the status of an appointment with payment details
router.put('/status/:id', async (req, res) => {
    const appointmentId = req.params.id;
    const { status, payment_status, amount, payment_date } = req.body; // Include payment details in the request

    try {
        const result = await pool.query(`
            SELECT patient_id, visit_type 
            FROM appointment 
            WHERE appointment_id = $1
        `, [appointmentId]);

        if (result.rowCount > 0) {
            const { patient_id, visit_type } = result.rows[0];

            if (status === 'Rejected' && visit_type === 'first') {
                await pool.query('BEGIN');
                await pool.query(`DELETE FROM appointment WHERE appointment_id = $1`, [appointmentId]);
                await pool.query(`DELETE FROM patients WHERE patient_id = $1`, [patient_id]);
                await pool.query('COMMIT');
                res.status(200).json({ message: 'Appointment rejected, and patient data deleted' });
            } else if (status === 'Approved') {
                // Update appointment status and add payment details
                await pool.query(`
                    UPDATE appointment
                    SET status = $1, payment_status = $2, amount = $3, payment_date = $4
                    WHERE appointment_id = $5
                `, [status, payment_status || 'Paid', amount || 0, payment_date || new Date(), appointmentId]);

                res.status(200).json({ message: 'Appointment approved with payment details' });
            } else {
                await pool.query(`
                    UPDATE appointment SET status = $1 WHERE appointment_id = $2
                `, [status, appointmentId]);

                res.status(200).json({ message: `Appointment ${status} successfully` });
            }
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (error) {
        console.error('Error updating appointment status with payment:', error.message);
        await pool.query('ROLLBACK');
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



router.patch('/:id', async (req, res) => {
    const appointmentId = req.params.id;
    
    const {
        patient_name,
        patient_gender,
        patient_age,
        patient_email,
        patient_phone,
        doctor_id,
        appointment_date,
        appointment_time,
        treatment_type,
        notes,
        visit_type,
    } = req.body;

    try {
        let patientResult;
        let patientId;

        // Check if patient exists by email or phone
        if (patient_email) {
            patientResult = await pool.query('SELECT * FROM patients WHERE email = $1', [patient_email]);
        } else if (patient_phone) {
            patientResult = await pool.query('SELECT * FROM patients WHERE phone = $1', [patient_phone]);
        }

        if (patientResult && patientResult.rows.length > 0) {
            patientId = patientResult.rows[0].patient_id;
        } else {
            // Insert new patient if none exists
            const newPatient = await pool.query(
                'INSERT INTO patients (name, gender, age, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING patient_id',
                [patient_name, patient_gender, patient_age || null, patient_email, patient_phone]
            );
            patientId = newPatient.rows[0].patient_id;
        }

        // Update appointment data with the referenced patient_id
        const result = await pool.query(
            `UPDATE appointment 
             SET patient_id = $1, doctor_id = $2, appointment_date = $3, 
                 appointment_time = $4, treatment_type = $5, notes = $6, visit_type = $7
             WHERE appointment_id = $8`,
            [patientId, doctor_id, appointment_date || new Date(), appointment_time || null, treatment_type, notes, visit_type, appointmentId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'An error occurred while updating the appointment' });
    }
});


module.exports = router;
