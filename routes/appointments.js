// routes/appointments.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { logAppointmentChange } = require('../middleware/logger');

// Helper to get full appointment details by ID, including patient and doctor names
async function getAppointmentById(id) {
    const result = await pool.query(`
        SELECT
            a.appointment_id,
            a.patient_id,
            a.doctor_id,
            a.appointment_date,
            a.appointment_time,
            a.treatment_type,
            a.status,
            a.visit_type,
            a.notes,
            a.payment_status,
            a.amount,
            a.payment_date,
            a.payment_message,
            p.name AS patient_name,
            d.name AS doctor_name
        FROM appointment a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.appointment_id = $1
    `, [id]);
    return result.rows[0] || null;
}

// GET all appointments with names
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                a.appointment_id,
                p.name,
                p.gender,
                p.age,
                p.email,
                p.phone,
                d.name AS doctor_name,
                a.appointment_date,
                a.appointment_time,
                a.treatment_type,
                a.visit_type,
                a.notes,
                a.status,
                a.payment_status,
                a.amount,
                a.payment_date,
                a.payment_message
            FROM appointment a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN doctors d ON a.doctor_id = d.id
            ORDER BY a.appointment_id DESC
        `);

        const appointments = result.rows;
        const doctorsResult = await pool.query('SELECT id, name FROM doctors ORDER BY name');
        const doctors = doctorsResult.rows;

        res.render('admin/appointments', { appointments, doctors });
    } catch (error) {
        console.error('Error fetching appointments:', error.message);
        console.error(error.stack);
        res.status(500).send('Internal Server Error');
    }
});

// AJAX Search Endpoint - Updated to include search by appointment_id
router.get('/search', async (req, res) => {
    try {
        const { search } = req.query;
        let baseQuery = `
            SELECT
                a.appointment_id,
                p.name,
                p.gender,
                p.age,
                p.email,
                p.phone,
                d.name AS doctor_name,
                a.appointment_date,
                a.appointment_time,
                a.treatment_type,
                a.visit_type,
                a.notes,
                a.status
            FROM appointment a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN doctors d ON a.doctor_id = d.id
        `;

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (search && search.trim() !== '') {
            const trimmedSearch = search.trim();
            const isNumeric = /^\d+$/.test(trimmedSearch);

            if (isNumeric) {
                // If search input is numeric, include appointment_id in search
                conditions.push(`a.appointment_id = $${paramIndex}`);
                params.push(parseInt(trimmedSearch, 10));
                paramIndex++;
            }

            // Add conditions for patient name, doctor name, email, and phone
            const searchLower = `%${trimmedSearch.toLowerCase()}%`;
            conditions.push(`
                LOWER(p.name) LIKE $${paramIndex}
                OR LOWER(d.name) LIKE $${paramIndex}
                OR LOWER(p.email) LIKE $${paramIndex}
                OR p.phone LIKE $${paramIndex}
            `);
            params.push(searchLower);
            paramIndex++;
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' OR ');
        }

        baseQuery += ' ORDER BY a.appointment_id DESC';

        const result = await pool.query(baseQuery, params);
        const appointments = result.rows;
        res.json({ appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get specific appointment details by ID with patient and doctor names
router.get('/:appointmentId', async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const result = await pool.query(`
            SELECT
                a.appointment_id,
                p.name AS patient_name,
                p.gender,
                p.age,
                p.email,
                p.phone,
                d.id AS doctor_id,
                d.name AS doctor_name,
                a.appointment_date,
                a.appointment_time,
                a.treatment_type,
                a.visit_type,
                a.notes,
                a.status,
                a.payment_status,
                a.amount,
                a.payment_date,
                a.payment_message
            FROM appointment a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.appointment_id = $1
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

// Book a new appointment
router.post('/', async (req, res) => {
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
        visit_type
    } = req.body;

    try {
        const adminId = req.session.userId;

        let patientResult;
        let patientId;

        if (patient_email) {
            patientResult = await pool.query('SELECT * FROM patients WHERE email = $1', [patient_email]);
        } else if (patient_phone) {
            patientResult = await pool.query('SELECT * FROM patients WHERE phone = $1', [patient_phone]);
        }

        if (patientResult && patientResult.rows.length > 0) {
            patientId = patientResult.rows[0].patient_id;

            if (visit_type === 'first') {
                return res.status(400).json({ message: 'This email or phone is already associated with a patient. Select "Return Visit" instead.' });
            }
        } else {
            const newPatient = await pool.query(
                'INSERT INTO patients (name, gender, age, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING patient_id',
                [patient_name, patient_gender, patient_age || null, patient_email || null, patient_phone || null]
            );
            patientId = newPatient.rows[0].patient_id;
        }

        const status = 'Pending';
        const insertResult = await pool.query(
            'INSERT INTO appointment (patient_id, doctor_id, appointment_date, appointment_time, treatment_type, status, visit_type, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING appointment_id',
            [patientId, doctor_id, appointment_date || new Date(), appointment_time || null, treatment_type, status, visit_type, notes]
        );

        const newAppointmentId = insertResult.rows[0].appointment_id;
        const newAppointment = await getAppointmentById(newAppointmentId);

        await logAppointmentChange(adminId, newAppointmentId, 'CREATE_APPOINTMENT', null, newAppointment);

        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (error) {
        console.error('Error booking appointment:', error);
        if (error.code === '23505') { // Unique violation
            res.status(400).json({ message: 'Duplicate entry detected. Patient data already exists.' });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
});

// Delete appointment
router.delete('/delete/:id', async (req, res) => {
    const appointmentId = req.params.id;
    try {
        const adminId = req.session.userId; 
        const oldAppointment = await getAppointmentById(appointmentId);

        const result = await pool.query(`
            SELECT patient_id, visit_type
            FROM appointment
            WHERE appointment_id = $1
        `, [appointmentId]);

        if (result.rowCount > 0) {
            const { patient_id, visit_type } = result.rows[0];

            await pool.query('BEGIN');
            await pool.query(`DELETE FROM appointment WHERE appointment_id = $1`, [appointmentId]);

            if (visit_type === 'first') {
                await pool.query(`DELETE FROM patients WHERE patient_id = $1`, [patient_id]);
            }

            await pool.query('COMMIT');

            await logAppointmentChange(adminId, appointmentId, 'DELETE_APPOINTMENT', oldAppointment, null);

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

// Update appointment status (with payment)
router.put('/status/:id', async (req, res) => {
    const appointmentId = req.params.id;
    const { status, payment_status, amount, payment_date, payment_message } = req.body;

    try {
        const adminId = req.session.userId; 
        const oldAppointment = await getAppointmentById(appointmentId);

        const result = await pool.query(`
            SELECT patient_id, visit_type, status
            FROM appointment
            WHERE appointment_id = $1
        `, [appointmentId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const { patient_id, visit_type } = result.rows[0];

        if (status === 'Rejected' && visit_type === 'first') {
            await pool.query('BEGIN');
            await pool.query(`DELETE FROM appointment WHERE appointment_id = $1`, [appointmentId]);
            await pool.query(`DELETE FROM patients WHERE patient_id = $1`, [patient_id]);
            await pool.query('COMMIT');

            await logAppointmentChange(adminId, appointmentId, 'REJECT_FIRST_APPOINTMENT', oldAppointment, null);

            return res.status(200).json({ message: 'Appointment rejected, and patient data deleted' });
        }

        if (status === 'Completed') {
            if (!amount || isNaN(amount) || amount <= 0) {
                return res.status(400).json({ message: 'A valid payment amount is required to complete the appointment.' });
            }

            const payDate = payment_date || new Date();

            await pool.query(`
                UPDATE appointment
                SET status = $1, payment_status = $2, amount = $3, payment_date = $4, payment_message = $5
                WHERE appointment_id = $6
            `, [status, payment_status || 'Paid', amount, payDate, payment_message || null, appointmentId]);

            const newAppointment = await getAppointmentById(appointmentId);
            await logAppointmentChange(adminId, appointmentId, 'COMPLETE_APPOINTMENT', oldAppointment, newAppointment);

            return res.status(200).json({ message: 'Appointment completed with payment details recorded.' });
        }

        // For other statuses:
        await pool.query(`
            UPDATE appointment
            SET status = $1, payment_status = $2, amount = $3, payment_date = $4, payment_message = $5
            WHERE appointment_id = $6
        `, [
            status,
            payment_status || (status === 'Approved' ? 'Pending' : null),
            amount || null,
            payment_date || null,
            payment_message || null,
            appointmentId
        ]);

        const newAppointment = await getAppointmentById(appointmentId);
        await logAppointmentChange(adminId, appointmentId, 'CHANGE_STATUS', oldAppointment, newAppointment);

        res.status(200).json({ message: `Appointment ${status} successfully` });

    } catch (error) {
        console.error('Error updating appointment status with payment:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Edit payment details of a completed appointment
router.put('/:id/payment', async (req, res) => {
    const appointmentId = req.params.id;
    const { payment_status, amount, payment_date, payment_message } = req.body;

    try {
        const adminId = req.session.userId; 
        const oldAppointment = await getAppointmentById(appointmentId);

        const result = await pool.query(`
            SELECT status
            FROM appointment
            WHERE appointment_id = $1
        `, [appointmentId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const { status } = result.rows[0];

        if (status !== 'Completed') {
            return res.status(400).json({ message: 'Payment can only be edited for completed appointments.' });
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'A valid payment amount is required.' });
        }

        const payDate = payment_date || new Date();

        await pool.query(`
            UPDATE appointment
            SET payment_status = $1, amount = $2, payment_date = $3, payment_message = $4
            WHERE appointment_id = $5
        `, [payment_status || 'Paid', amount, payDate, payment_message || null, appointmentId]);

        const newAppointment = await getAppointmentById(appointmentId);
        await logAppointmentChange(adminId, appointmentId, 'UPDATE_PAYMENT', oldAppointment, newAppointment);

        res.status(200).json({ message: 'Payment details updated successfully.' });
    } catch (error) {
        console.error('Error updating payment details:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update appointment details
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
        const adminId = req.session.userId; 
        const oldAppointment = await getAppointmentById(appointmentId);

        let patientResult;
        let patientId;

        if (patient_email) {
            patientResult = await pool.query('SELECT * FROM patients WHERE email = $1', [patient_email]);
        } else if (patient_phone) {
            patientResult = await pool.query('SELECT * FROM patients WHERE phone = $1', [patient_phone]);
        }

        if (patientResult && patientResult.rows.length > 0) {
            patientId = patientResult.rows[0].patient_id;
        } else {
            const newPatient = await pool.query(
                'INSERT INTO patients (name, gender, age, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING patient_id',
                [patient_name, patient_gender, patient_age || null, patient_email, patient_phone]
            );
            patientId = newPatient.rows[0].patient_id;
        }

        const updateResult = await pool.query(
            `UPDATE appointment
             SET patient_id = $1, doctor_id = $2, appointment_date = $3,
                 appointment_time = $4, treatment_type = $5, notes = $6, visit_type = $7
             WHERE appointment_id = $8`,
            [patientId, doctor_id, appointment_date || new Date(), appointment_time || null, treatment_type, notes, visit_type, appointmentId]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const newAppointment = await getAppointmentById(appointmentId);
        await logAppointmentChange(adminId, appointmentId, 'UPDATE_APPOINTMENT', oldAppointment, newAppointment);

        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'An error occurred while updating the appointment' });
    }
});

module.exports = router;
