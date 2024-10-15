const express = require("express")
const router = express.Router();
const multer = require("multer")
const path = require('path');
const pool = require("../models/db")


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Specify the directory where images will be stored
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
}).single('image'); // Accept a single file with the field name 'image'



// Route to render the add doctor form
router.get('/add', (req, res) => {
    res.render('admin/add_doctor');
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
            res.redirect('/dashboard/doctor'); // Redirect to doctor list page after adding
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
        res.render('admin/doctor_profiles', { doctors });
    } catch (error) {
        console.error('Error fetching doctor profiles:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render the update doctor form
router.get('/edit/:id', async (req, res) => {
    const doctorId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM doctors WHERE id = $1', [doctorId]);
        const doctor = result.rows[0];
        res.render('admin/edit_doctors', { doctor });
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
        const image_url = req.file ? `/uploads/${req.file.filename}` : null; // Store image path in the database

        try {
            await pool.query(
                'UPDATE doctors SET name = $1, qualification = $2, expertise = $3, photo = $4 WHERE id = $5',
                [name, qualification, expertise, image_url, doctorId]
            );
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
        await pool.query('DELETE FROM doctors WHERE id = $1', [doctorId]);
        res.redirect('/dashboard/doctor'); // Redirect to doctor list page after deletion
    } catch (error) {
        console.error('Error deleting doctor profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router
