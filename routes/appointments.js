const express = require('express');
const router = express.Router();
const pool = require('../models/db');

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

// Route to handle appointment booking
router.post('/book', async (req, res) => {
    const { patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, treatment_type } = req.body;
    try {
        await pool.query(
            'INSERT INTO appointments (patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, treatment_type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, treatment_type]
        );
        res.redirect('/appointments');
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).send('Internal Server Error');
    }
});

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


module.exports = router;
