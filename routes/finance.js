// routes/finance.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { ensureSuperAdmin, isAuthenticated } = require('../middleware/auth');
const { logExpenseChange, logIncomeChange } = require('../middleware/logger'); // Corrected Path

// Middleware to ensure the user is authenticated and is a super admin
router.use(isAuthenticated);
router.use(ensureSuperAdmin);

/**
 * GET /dashboard/finance
 * Renders the finance.ejs page
 */
router.get('/', (req, res) => {
    res.render('admin/finance', { name: req.session.name });
});

/**
 * GET /dashboard/finance/summary
 * Fetches Total Income, Total Expenses, and Net Income
 * Optional Query Parameters:
 * - startDate: YYYY-MM-DD
 * - endDate: YYYY-MM-DD
 */
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`GET /summary called with startDate=${startDate}, endDate=${endDate}`);

        // Validate Date Inputs
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start) || isNaN(end)) {
                console.log('Invalid date format.');
                return res.status(400).json({ message: 'Invalid date format.' });
            }
            if (start > end) {
                console.log('Start Date is after End Date.');
                return res.status(400).json({ message: 'Start Date cannot be after End Date.' });
            }
        }

        // Calculate Total Income from Appointments
        const totalAppointmentIncomeQuery = `
            SELECT COALESCE(SUM(amount), 0) AS total_appointment_income
            FROM appointment
            WHERE payment_status = 'Paid'
            ${startDate && endDate ? 'AND payment_date BETWEEN $1 AND $2' : ''}
        `;
        const appointmentIncomeParams = startDate && endDate ? [startDate, endDate] : [];
        console.log(`Executing Query: ${totalAppointmentIncomeQuery} with params: ${appointmentIncomeParams}`);
        const appointmentIncomeResult = await pool.query(totalAppointmentIncomeQuery, appointmentIncomeParams);
        const totalAppointmentIncome = parseFloat(appointmentIncomeResult.rows[0].total_appointment_income) || 0;
        console.log(`Total Appointment Income: ${totalAppointmentIncome}`);

        // Calculate Total Income from Manual Adjustments
        const totalManualIncomeQuery = `
            SELECT COALESCE(SUM(amount), 0) AS total_manual_income
            FROM incomes
            ${startDate && endDate ? 'WHERE date BETWEEN $1 AND $2' : ''}
        `;
        const manualIncomeParams = startDate && endDate ? [startDate, endDate] : [];
        console.log(`Executing Query: ${totalManualIncomeQuery} with params: ${manualIncomeParams}`);
        const manualIncomeResult = await pool.query(totalManualIncomeQuery, manualIncomeParams);
        const totalManualIncome = parseFloat(manualIncomeResult.rows[0].total_manual_income) || 0;
        console.log(`Total Manual Income: ${totalManualIncome}`);

        // Calculate Total Income
        const totalIncome = totalAppointmentIncome + totalManualIncome;
        console.log(`Total Income: ${totalIncome}`);

        // Calculate Total Expenses
        const totalExpensesQuery = `
            SELECT COALESCE(SUM(amount), 0) AS total_expenses
            FROM expenses
            ${startDate && endDate ? 'WHERE date BETWEEN $1 AND $2' : ''}
        `;
        const expensesParams = startDate && endDate ? [startDate, endDate] : [];
        console.log(`Executing Query: ${totalExpensesQuery} with params: ${expensesParams}`);
        const expensesResult = await pool.query(totalExpensesQuery, expensesParams);
        const totalExpenses = parseFloat(expensesResult.rows[0].total_expenses) || 0;
        console.log(`Total Expenses: ${totalExpenses}`);

        // Calculate Net Income
        const netIncome = totalIncome - totalExpenses;
        console.log(`Net Income: ${netIncome}`);

        res.json({
            totalIncome: totalIncome.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            netIncome: netIncome.toFixed(2)
        });
    } catch (error) {
        console.error('Error fetching financial summary:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET /dashboard/finance/chart-data
 * Provides monthly income and expenses for the given date range
 * Query Parameters:
 * - startDate: YYYY-MM-DD
 * - endDate: YYYY-MM-DD
 */
router.get('/chart-data', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`GET /chart-data called with startDate=${startDate}, endDate=${endDate}`);

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start Date and End Date are required.' });
        }

        // Validate Date Formats
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: 'Invalid date format.' });
        }

        // Ensure Start Date is before End Date
        if (start > end) {
            return res.status(400).json({ message: 'Start Date cannot be after End Date.' });
        }

        // Generate list of months between startDate and endDate
        const months = [];
        const incomeData = [];
        const expensesData = [];

        const current = new Date(start.getFullYear(), start.getMonth(), 1);

        while (current <= end) {
            const month = current.getMonth() + 1; // Months are zero-based
            const year = current.getFullYear();
            const monthStr = `${year}-${month < 10 ? '0' + month : month}`;

            months.push(monthStr);

            // Calculate income for the month from Appointments
            const incomeResult = await pool.query(`
                SELECT COALESCE(SUM(amount), 0) AS total_appointment_income
                FROM appointment
                WHERE payment_status = 'Paid'
                AND TO_CHAR(payment_date, 'YYYY-MM') = $1
            `, [monthStr]);
            const appointmentIncome = parseFloat(incomeResult.rows[0].total_appointment_income) || 0;
            console.log(`Month: ${monthStr}, Appointment Income: ${appointmentIncome}`);

            // Calculate income for the month from Manual Adjustments
            const manualIncomeResult = await pool.query(`
                SELECT COALESCE(SUM(amount), 0) AS total_manual_income
                FROM incomes
                WHERE TO_CHAR(date, 'YYYY-MM') = $1
            `, [monthStr]);
            const manualIncome = parseFloat(manualIncomeResult.rows[0].total_manual_income) || 0;
            console.log(`Month: ${monthStr}, Manual Income: ${manualIncome}`);

            incomeData.push(appointmentIncome + manualIncome);

            // Calculate expenses for the month
            const expensesResult = await pool.query(`
                SELECT COALESCE(SUM(amount), 0) AS total_expenses
                FROM expenses
                WHERE TO_CHAR(date, 'YYYY-MM') = $1
            `, [monthStr]);
            const expenses = parseFloat(expensesResult.rows[0].total_expenses) || 0;
            expensesData.push(expenses);

            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }

        res.json({
            labels: months.map(m => {
                const date = new Date(m + '-01');
                return date.toLocaleString('default', { month: 'long', year: 'numeric' });
            }),
            income: incomeData,
            expenses: expensesData
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET /dashboard/finance/expense-categories
 * Provides distribution of expenses by category within a date range
 * Query Parameters:
 * - startDate: YYYY-MM-DD
 * - endDate: YYYY-MM-DD
 */
router.get('/expense-categories', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`GET /expense-categories called with startDate=${startDate}, endDate=${endDate}`);

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start Date and End Date are required.' });
        }

        // Validate Date Formats
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: 'Invalid date format.' });
        }

        // Ensure Start Date is before End Date
        if (start > end) {
            return res.status(400).json({ message: 'Start Date cannot be after End Date.' });
        }

        const query = `
            SELECT type, COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE date BETWEEN $1 AND $2
            GROUP BY type
        `;
        const result = await pool.query(query, [startDate, endDate]);
        console.log(`Fetched ${result.rows.length} expense categories.`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching expense categories:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET /dashboard/finance/incomes
 * Fetches all manual income adjustments, optionally filtered by date range
 */
router.get('/incomes', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`GET /incomes called with startDate=${startDate}, endDate=${endDate}`);

        // Validate Date Inputs
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start) || isNaN(end)) {
                console.log('Invalid date format.');
                return res.status(400).json({ message: 'Invalid date format.' });
            }
            if (start > end) {
                console.log('Start Date is after End Date.');
                return res.status(400).json({ message: 'Start Date cannot be after End Date.' });
            }
        }

        // Fetch incomes based on date range if provided
        let query = 'SELECT * FROM incomes';
        let params = [];
        if (startDate && endDate) {
            query += ' WHERE date BETWEEN $1 AND $2 ORDER BY date DESC';
            params = [startDate, endDate];
        } else {
            query += ' ORDER BY date DESC';
        }

        console.log(`Executing Query: ${query} with params: ${params}`);
        const incomesResult = await pool.query(query, params);
        console.log(`Fetched ${incomesResult.rows.length} incomes.`);
        res.json(incomesResult.rows);
    } catch (error) {
        console.error('Error fetching manual incomes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * POST /dashboard/finance/incomes
 * Adds a new manual income adjustment
 * Body Parameters:
 * - description: String
 * - amount: Number
 * - date: YYYY-MM-DD (optional)
 */
router.post('/incomes', async (req, res) => {
    const { description, amount, date } = req.body;

    // Basic Validation
    if (!description || typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: 'Valid description is required.' });
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Valid amount is required.' });
    }
    if (date && isNaN(new Date(date))) {
        return res.status(400).json({ message: 'Invalid date format.' });
    }

    try {
        const adminId = req.session.userId; // Ensure you have the admin ID in session
        const incomeDate = date ? new Date(date) : new Date();

        const insertResult = await pool.query(`
            INSERT INTO incomes (description, amount, date)
            VALUES ($1, $2, $3)
            RETURNING id, description, amount, date, created_at, updated_at
        `, [description.trim(), parseFloat(amount), incomeDate]);

        const newIncome = insertResult.rows[0];
        await logIncomeChange(adminId, newIncome.id, 'CREATE_INCOME', null, newIncome);

        res.status(201).json({ message: 'Manual income added successfully.', income: newIncome });
    } catch (error) {
        console.error('Error adding manual income:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * PUT /dashboard/finance/incomes/:id
 * Updates an existing manual income adjustment
 * Body Parameters:
 * - description: String
 * - amount: Number
 * - date: YYYY-MM-DD (optional)
 */
router.put('/incomes/:id', async (req, res) => {
    const incomeId = req.params.id;
    const { description, amount, date } = req.body;

    // Basic Validation
    if (!description || typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: 'Valid description is required.' });
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Valid amount is required.' });
    }
    if (date && isNaN(new Date(date))) {
        return res.status(400).json({ message: 'Invalid date format.' });
    }

    try {
        const adminId = req.session.userId; // Ensure you have the admin ID in session
        const incomeDate = date ? new Date(date) : new Date();

        // Fetch existing income for audit logging
        const oldIncomeResult = await pool.query('SELECT * FROM incomes WHERE id = $1', [incomeId]);
        if (oldIncomeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Manual income not found.' });
        }
        const oldIncome = oldIncomeResult.rows[0];

        const updateResult = await pool.query(`
            UPDATE incomes
            SET description = $1, amount = $2, date = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, description, amount, date, created_at, updated_at
        `, [description.trim(), parseFloat(amount), incomeDate, incomeId]);

        const updatedIncome = updateResult.rows[0];
        await logIncomeChange(adminId, updatedIncome.id, 'UPDATE_INCOME', oldIncome, updatedIncome);

        res.json({ message: 'Manual income updated successfully.', income: updatedIncome });
    } catch (error) {
        console.error('Error updating manual income:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * DELETE /dashboard/finance/incomes/:id
 * Deletes a manual income adjustment
 */
router.delete('/incomes/:id', async (req, res) => {
    const incomeId = req.params.id;

    try {
        const adminId = req.session.userId; // Ensure you have the admin ID in session

        // Fetch existing income for audit logging
        const oldIncomeResult = await pool.query('SELECT * FROM incomes WHERE id = $1', [incomeId]);
        if (oldIncomeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Manual income not found.' });
        }
        const oldIncome = oldIncomeResult.rows[0];

        await pool.query('DELETE FROM incomes WHERE id = $1', [incomeId]);
        await logIncomeChange(adminId, incomeId, 'DELETE_INCOME', oldIncome, null);

        res.json({ message: 'Manual income deleted successfully.' });
    } catch (error) {
        console.error('Error deleting manual income:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET /dashboard/finance/incomes/:id
 * Fetches a single manual income adjustment by ID
 */
router.get('/incomes/:id', async (req, res) => {
    const incomeId = req.params.id;

    try {
        console.log(`GET /incomes/${incomeId} called`);
        const result = await pool.query('SELECT * FROM incomes WHERE id = $1', [incomeId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Manual income not found.' });
        }
        res.json({ income: result.rows[0] });
    } catch (error) {
        console.error('Error fetching manual income:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
