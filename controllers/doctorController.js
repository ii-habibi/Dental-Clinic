const pool = require("../models/db");
const path = require("path");
const fs = require("fs");

// Get all doctor profiles
exports.getAllDoctors = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM doctors');
        const doctors = result.rows;
        preventCaching(res);
        res.render('admin/doctors', { doctors, action: 'list', pageTitle: 'Doctor Profiles' });
    } catch (error) {
        console.error("Error fetching doctor profiles:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Get a single doctor for editing
exports.getDoctorById = async (req, res) => {
    const doctorId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM doctors WHERE id = $1', [doctorId]);
        const doctor = result.rows[0];
        preventCaching(res);
        res.render('admin/doctors', { doctor, action: 'edit', pageTitle: 'Edit Doctor Profile' });
    } catch (error) {
        console.error("Error fetching doctor details for update:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Add a new doctor profile
exports.addDoctor = async (req, res) => {
    const { name, qualification, expertise } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await pool.query(
            'INSERT INTO doctors (name, qualification, expertise, photo) VALUES ($1, $2, $3, $4)',
            [name, qualification, expertise, image_url]
        );
        res.redirect('/dashboard/doctor');
    } catch (error) {
        console.error("Error adding doctor profile:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Update doctor profile
exports.updateDoctor = async (req, res) => {
    const doctorId = req.params.id;
    const { name, qualification, expertise } = req.body;

    try {
        let image_url = req.file ? `/uploads/${req.file.filename}` : null;
        if (!image_url) {
            const result = await pool.query('SELECT photo FROM doctors WHERE id = $1', [doctorId]);
            image_url = result.rows[0]?.photo;
        }

        await pool.query(
            'UPDATE doctors SET name = $1, qualification = $2, expertise = $3, photo = $4 WHERE id = $5',
            [name, qualification, expertise, image_url, doctorId]
        );
        preventCaching(res);
        res.redirect('/dashboard/doctor');
    } catch (error) {
        console.error("Error updating doctor profile:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Delete doctor profile
exports.deleteDoctor = async (req, res) => {
    const doctorId = req.params.id;

    try {
        const result = await pool.query('SELECT photo FROM doctors WHERE id = $1', [doctorId]);
        const doctor = result.rows[0];

        await pool.query('DELETE FROM doctors WHERE id = $1', [doctorId]);

        if (doctor?.photo) {
            const imagePath = path.join(__dirname, '../public', doctor.photo);
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Error deleting image file:", err);
            });
        }

        res.redirect('/dashboard/doctor');
    } catch (error) {
        console.error("Error deleting doctor profile:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Prevent caching
const preventCaching = (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
};

