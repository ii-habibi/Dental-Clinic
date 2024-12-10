// routes/expenses.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { ensureSuperAdmin, isAuthenticated } = require('../middleware/auth');
const { logExpenseChange } = require('../middleware/logger');

router.use(isAuthenticated);

// GET /dashboard/expenses - Render the expenses page
router.get('/', ensureSuperAdmin, (req, res) => {
    res.render('admin/expenses', { name: req.session.name });
});

// GET /dashboard/expenses/doctors - List doctors for dropdown
router.get('/doctors', ensureSuperAdmin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, name FROM doctors ORDER BY name`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// GET /dashboard/expenses/expenses - Fetch all expenses with doctor name
router.get('/expenses', ensureSuperAdmin, async (req, res) => {
    try {
        const query = `
            SELECT e.id, e.date, e.amount, e.type, e.description,
                   d.name AS doctor_name
            FROM expenses e
            LEFT JOIN doctors d ON e.doctor_id = d.id
            ORDER BY e.date DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /dashboard/expenses/expenses - Add a new expense (super admin only)
router.post('/expenses', ensureSuperAdmin, async (req, res) => {
    const { doctor_id, amount, type, description } = req.body;
    if (!amount || !type) {
        return res.status(400).json({ message: 'Amount and type are required.' });
    }

    try {
        const adminId = req.session.userId;
        const doctorIdValue = doctor_id && doctor_id !== '' ? doctor_id : null;

        const insertResult = await pool.query(`
            INSERT INTO expenses (doctor_id, amount, type, description)
            VALUES ($1, $2, $3, $4)
            RETURNING id, doctor_id, amount, type, description, date
        `, [doctorIdValue, amount, type, description || null]);

        const newExpense = insertResult.rows[0];
        await logExpenseChange(adminId, newExpense.id, 'CREATE_EXPENSE', null, newExpense);

        res.status(201).json({ message: 'Expense added successfully' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
