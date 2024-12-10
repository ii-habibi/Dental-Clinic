// routes/dashboard.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { ensureSuperAdmin, isAuthenticated } = require('../middleware/auth');
const { logAppointmentChange, logExpenseChange } = require('../middleware/logger');

router.use(isAuthenticated);
router.use(ensureSuperAdmin);

// GET /dashboard/doctors - List all doctors
router.get('/doctors', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM doctors ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET /dashboard/patients - List all patients
router.get('/patients', async (req, res) => {
    try {
        const result = await pool.query('SELECT patient_id, name FROM patients ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET /dashboard/audit-logs - Fetch all audit logs
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                audit_logs.id,
                audit_logs.appointment_id,
                audit_logs.expense_id,
                audit_logs.action_type,
                audit_logs.old_value,
                audit_logs.new_value,
                audit_logs.created_at,
                admins.name AS admin_name,
                admins.username AS admin_username
            FROM audit_logs
            JOIN admins ON audit_logs.admin_id = admins.id
            ORDER BY audit_logs.created_at DESC
        `);

        const logs = result.rows;
        res.json({ logs });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
