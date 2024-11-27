// controllers/patientsController.js
const pool = require('../models/db'); // Import database connection

// Get all patients with appointment count and details
exports.getAllPatients = async (req, res) => {
    try {
        const patients = await pool.query(`
            SELECT 
                p.patient_id, 
                p.name, 
                p.age, 
                p.gender, 
                p.email, 
                p.phone, 
                p.address, 
                COUNT(a.appointment_id) AS appointment_count,
                json_agg(
                    json_build_object(
                        'appointment_id', a.appointment_id,
                        'treatment_type', a.treatment_type,
                        'notes', a.notes,
                        'status', a.status,
                        'appointment_date', a.appointment_date,
                        'appointment_time', a.appointment_time,
                        'doctor_name', d.name
                    )
                ) AS appointments
            FROM patients p
            LEFT JOIN appointment a ON a.patient_id = p.patient_id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            GROUP BY p.patient_id
            ORDER BY p.patient_id DESC;
        `);

        res.render('admin/patients', { patients: patients.rows });
    } catch (error) {
        console.error("Error retrieving patients:", error);
        res.status(500).send("Error retrieving patients.");
    }
};

// Search patients
exports.searchPatients = async (req, res) => {
    const { query } = req.query;
    try {
        const results = await pool.query(`
            SELECT patients.*, 
                   COALESCE(json_agg(appointment) FILTER (WHERE appointment.appointment_id IS NOT NULL), '[]') AS appointments
            FROM patients
            LEFT JOIN appointment ON patients.patient_id = appointment.patient_id
            WHERE patients.name ILIKE $1 OR patients.email ILIKE $1 OR patients.phone ILIKE $1
            GROUP BY patients.patient_id
        `, [`%${query}%`]);

        res.render('admin/patients', { patients: results.rows });
    } catch (error) {
        console.error("Error searching patients:", error);
        res.status(500).send("Error searching patients.");
    }
};

// Add a new patient
exports.addPatient = async (req, res) => {
    const { name, age, gender, email, phone, address } = req.body;
    try {
        await pool.query(`
            INSERT INTO patients (name, age, gender, email, phone, address )
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [name, age || null, gender || null, email || null, phone || null, address]);
        res.redirect('/dashboard/patients');
    } catch (error) {
        console.error("Error adding patient:", error);
        res.status(400).send("Email is already in use by a patient");
    }
};

// Delete a patient and their appointments
exports.deletePatient = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('BEGIN'); // Start a transaction

        // Delete the patient's appointments first
        await pool.query('DELETE FROM appointment WHERE patient_id = $1', [id]);

        // Then delete the patient
        await pool.query('DELETE FROM patients WHERE patient_id = $1', [id]);

        await pool.query('COMMIT'); // Commit the transaction

        res.status(200).json({ success: true });
    } catch (error) {
        await pool.query('ROLLBACK'); // Rollback in case of error
        console.error("Error deleting patient and appointments:", error);
        res.status(500).send("Error deleting patient and appointments.");
    }
};

// Update (PATCH) a patient's details
exports.updatePatient = async (req, res) => {
    const { id } = req.params;
    const { name, age, gender, email, phone, address } = req.body;
    try {
        await pool.query(`
            UPDATE patients 
            SET name = $1, age = $2, gender = $3, email = $4, phone = $5, address = $6
            WHERE patient_id = $7
        `, [name, age || null, gender || null, email || null, phone, address || null, id]);

        res.sendStatus(200); // Send success status
    } catch (error) {
        console.error("Error updating patient:", error);
        res.status(500).send("Error updating patient.");
    }
};
