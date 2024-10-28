
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const pool = require("../models/db");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Rename the file with a timestamp
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (mimeType && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
}).single('image'); // Accept a single 'image'

// Route to render the add doctor form
router.get('/add', (req, res) => {
    res.render('admin/doctors', { action: 'add', pageTitle: 'Add Doctor Profile' });
});

// Route to handle doctor profile submission 
router.post('/add', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading image:', err);
            return res.status(500).send('Image upload error');
        }

        const { name, qualification, expertise } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null; // Store image path in the database

        try {
            await pool.query('INSERT INTO doctors (name, qualification, expertise, photo) VALUES ($1, $2, $3, $4)',
                [name, qualification, expertise, image_url]);
            res.redirect('/dashboard/doctor');
        } catch (error) {
            console.error('Error adding doctor profile:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});

// Route to display all doctor profiles
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM doctors');
        const doctors = result.rows;
        // Set headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.render('admin/doctors', { doctors, action: 'list', pageTitle: 'Doctor Profiles' });
    } catch (error) {
        console.error('Error fetching doctor profiles:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render the update doctor form with caching prevention headers
router.get('/edit/:id', async (req, res) => {
    const doctorId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM doctors WHERE id = $1', [doctorId]);
        const doctor = result.rows[0];

        // Set headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.render('admin/doctors', { doctor, action: 'edit', pageTitle: 'Edit Doctor Profile' });
    } catch (error) {
        console.error('Error fetching doctor details for update:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle doctor profile update submission
router.post('/edit/:id', (req, res) => {
    const doctorId = req.params.id;
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading image:', err);
            return res.status(500).send('Image upload error');
        }

        const { name, qualification, expertise } = req.body;

        try {
            // Check if an image was uploaded if not keep the existing image
            let image_url;
            if (req.file) {
                image_url = `/uploads/${req.file.filename}`;
            } else {
                const result = await pool.query('SELECT photo FROM doctors WHERE id = $1', [doctorId]);
                image_url = result.rows[0].photo;
            }

            await pool.query(
                'UPDATE doctors SET name = $1, qualification = $2, expertise = $3, photo = $4 WHERE id = $5',
                [name, qualification, expertise, image_url, doctorId]
            );

            // Set headers to prevent caching
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            res.redirect('/dashboard/doctor'); // Redirect to doctor list page after updating
        } catch (error) {
            console.error('Error updating doctor profile:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});


// Route to handle doctor profile deletion
router.post('/delete/:id', async (req, res) => {
    const doctorId = req.params.id;
    try {
        // Get the doctor's details to retrieve the image path
        const result = await pool.query('SELECT photo FROM doctors WHERE id = $1', [doctorId]);
        const doctor = result.rows[0];

        // Delete the doctor profile from the database
        await pool.query('DELETE FROM doctors WHERE id = $1', [doctorId]);

        // Delete the image file from the server
        if (doctor && doctor.photo) {
            const imagePath = path.join(__dirname, '../public/', doctor.photo);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting image file:', err);
                } else {
                    console.log('Image file deleted successfully:', imagePath);
                }
            });
        }

        res.redirect('/dashboard/doctor'); // after deletion
    } catch (error) {
        console.error('Error deleting doctor profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
