// routes/patients.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');  // Import database connection

// Get all patients
router.get('/', async (req, res) => {
    try {
        const patients = await pool.query('SELECT * FROM patients');
        res.render('admin/patients', { patients: patients.rows });
    } catch (error) {
        console.error("Error retrieving patients:", error);
        res.status(500).send("Error retrieving patients.");
    }
});

// Search patients
router.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const results = await pool.query(`
            SELECT * FROM patients
            WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1
        `, [`%${query}%`]);
        res.render('admin/patients', { patients: results.rows });
    } catch (error) {
        console.error("Error searching patients:", error);
        res.status(500).send("Error searching patients.");
    }
});

// Add a new patient
router.post('/', async (req, res) => {
    const { name, age, gender, email, phone, address } = req.body;
    try {
        await pool.query(`
            INSERT INTO patients (name, age, gender, email, phone, address )
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [name, age || null, gender || null, email || null, phone || null, address ]);
        res.redirect('/dashboard/patients');
    } catch (error) {
        console.error("Error adding patient:", error);
        res.status(400).send("Email is already in Use by a Patient")
        res.status(500).send("Error adding patient.");
    }
});

// Delete a patient
router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM patients WHERE patient_id = $1', [id]);
        res.redirect('/dashboard/patients');
    } catch (error) {
        console.error("Error deleting patient:", error);
        res.status(500).send("Error deleting patient.");
    }
});

module.exports = router;