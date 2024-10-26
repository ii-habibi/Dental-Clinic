const express = require('express');
const router = express.Router();
const pool = require('../models/db');


// Route to display all appointments
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM appointments');
        const appointments = result.rows;
        res.render('admin/appointments', { appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
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

// Route to handle appointment booking with AJAX
router.post('/book', async (req, res) => {
    const { patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, treatment_type, visit_type } = req.body;
    try {
        await pool.query(
            'INSERT INTO appointments (patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, treatment_type, status, visit_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time || null, treatment_type, 'Pending', visit_type]
        );
        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (error) {
        if (error.code === '23505') { // Unique violation error code
            res.status(400).json({ message: 'This email is already associated with an appointment.' });
        } else {
            console.error('Error booking appointment:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});

// Route to handle deleting an Appointment with AJAX
router.delete('/delete/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM appointments WHERE appointment_id = $1', [appointmentId]);

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
