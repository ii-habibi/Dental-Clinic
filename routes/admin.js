const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path'); 
const pool = require('../models/db');

// Test route to check database connection
router.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.send(`Database connected: ${result.rows[0].now}`);
    } catch (err) {
        console.error(err);
        res.send('Error connecting to the database');
    }
});

// // Route for user home page
// router.get('/', (req, res) => {
//     res.render('user/home'); // Render the user home page
// });

// Route to Dashboard
router.get('/', (req, res) => {
    res.render('admin_dashboard');
});


// Set up Multer storage configuration
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
router.get('/doctor/add', (req, res) => {
    res.render('admin/add_doctor');
});

// Route to handle doctor profile submission 
router.post('/doctor/add', (req, res) => {
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
router.get('/doctor', async (req, res) => {
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
router.get('/doctor/edit/:id', async (req, res) => {
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
router.post('/doctor/edit/:id', (req, res) => {
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
router.post('/doctor/delete/:id', async (req, res) => {
    const doctorId = req.params.id;
    try {
        await pool.query('DELETE FROM doctors WHERE id = $1', [doctorId]);
        res.redirect('/dashboard/doctor'); // Redirect to doctor list page after deletion
    } catch (error) {
        console.error('Error deleting doctor profile:', error);
        res.status(500).send('Internal Server Error');
    }
});








// Get all services
router.get('/services', async (req, res) => {
    try {
        const services = await pool.query('SELECT * FROM Services'); // Ensure this matches your database setup
        res.render('admin/services_combined', { 
            view: 'list', 
            pageTitle: 'Services', 
            services: services.rows 
        });
    } catch (error) {
        console.error('Error fetching services:', error); // Log the error for debugging
        res.status(500).send('Internal Server Error'); // Send a 500 error response
    }
});

// Route to display services for users
router.get('/services/user', async (req, res) => {
    try {
        const services = await pool.query('SELECT * FROM Services'); // Fetch all services
        res.render('user/services', { services: services.rows }); // Render the user services page
    } catch (error) {
        console.error('Error fetching services for user:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render the add service form
router.get('/services/add', (req, res) => {
    res.render('admin/services_combined', { 
        view: 'add', 
        pageTitle: 'Add Service' 
    });
});

// Route to handle the addition of a new service
router.post('/services', async (req, res) => {
    const { name, description, price } = req.body; // Get the service name and description from the request body
    try {
        await pool.query('INSERT INTO Services (name, description, price) VALUES ($1, $2, $3)', [name, description, price]); // Adjust based on your database schema
        res.redirect('/dashboard/services'); // Redirect to the services list after adding
    } catch (error) {
        console.error('Error adding service:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to display the edit service form
router.get('/services/edit/:id', async (req, res) => {
    const serviceId = req.params.id;

    try {
        const result = await pool.query('SELECT * FROM Services WHERE service_id = $1', [serviceId]); // Ensure the table name matches
        const service = result.rows[0];

        if (!service) {
            return res.status(404).send('Service not found');
        }

        res.render('admin/services_combined', { 
            view: 'edit', 
            pageTitle: 'Edit Service', 
            service: service 
        });
    } catch (error) {
        console.error('Error fetching service for edit:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the update form submission
router.post('/services/edit/:id', async (req, res) => {
    const serviceId = req.params.id;
    const { name, description, price } = req.body; // Get data from the form

    try {
        const result = await pool.query(
            'UPDATE Services SET name = $1, description = $2, price = $3 WHERE service_id = $4', // Ensure the table name matches
            [name, description, price, serviceId] // Update the service
        );
        if (result.rowCount > 0) {
            res.status(200).send({ message: 'Service updated successfully' });
        } else {
            res.status(404).send({ message: 'Service not found' });
        }
    
    
        //  res.redirect('/admin/services'); // Redirect to the services list after updating
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the deletion of a service
router.delete('/services/:id', async (req, res) => {
    const serviceId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM services WHERE service_id = $1', [serviceId]);

        if (result.rowCount > 0) {
            res.status(200).send({ message: 'Service deleted successfully' });
        } else {
            res.status(404).send({ message: 'Service not found' });
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Route to get all Blog

router.get('/blogs', async (req, res) => {
    try {
        const blogs = await pool.query('Select * from blog');
        res.render('admin/blogs', { blogs: blogs.rows });
    } catch (error) {
        console.error('Error fething blogs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// route to render the add blog form
router.get('/blogs/add', (req, res) => {
    res.render('admin/add_blog')
});

//Route to Handle adding New Blog
router.post('/blogs', async (req, res) => {
    const { title, content, author } = req.body;
    try {
        await pool.query('INSERT INTO blog (title, content, author) VALUES ($1, $2, $3)', [title, content, author]);
        res.redirect('/dashboard/blogs');
    } catch (error) {
        console.error('Error in adding blogs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Routes to render the edit blog form
router.get('/blogs/edit/:id', async (req, res) => {
    const blogId = req.params.id;

    try {
        const result = await pool.query('SELECT * FROM blog WHERE blog_id = $1', [blogId]);
        const blog = result.rows[0];
        if (!blog) {
            return res.status(404).send('Blog not found')
        }
        res.render('admin/edit_blog', { blog });
    } catch (error) {
        console.error('Error fetching blog for edit:', error);
        res.status(500).send('internal server error');
    }
})

// Route to handle updating a blog
router.post('/blogs/edit/:id', async (req, res) => {
    const blogId = req.params.id;

    const { title, content, author } = req.body;
    try {
        await pool.query('UPDATE Blog SET title = $1, content = $2, author = $3 WHERE blog_id = $4',
            [title, content, author, blogId]);



        res.redirect('/dashboard/blogs'); // Redirect to blogs list after editing
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle deleting a blog
router.post('/blogs/delete/:id', async (req, res) => {
    const blogId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM Blog WHERE blog_id = $1', [blogId]);

        if (result.rowCount > 0) {
            res.status(200).send({ message: 'Blog deleted successfully' });
        } else {
            res.status(404).send({ message: 'Blog not found' });
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
