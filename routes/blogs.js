
const express = require('express');
const router = express.Router();
const pool = require('../models/db'); 

// Route to get all Blog
router.get('/', async (req, res) => {
    try {
        const blogs = await pool.query('SELECT * FROM blog');
        res.render('admin/blogs', { blogs: blogs.rows });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render the add blog form
router.get('/add', (req, res) => {
    res.render('admin/add_blog');
});

// Route to Handle adding New Blog
router.post('/', async (req, res) => {
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
router.get('/edit/:id', async (req, res) => {
    const blogId = req.params.id;

    try {
        const result = await pool.query('SELECT * FROM blog WHERE blog_id = $1', [blogId]);
        const blog = result.rows[0];
        if (!blog) {
            return res.status(404).send('Blog not found');
        }
        res.render('admin/edit_blog', { blog });
    } catch (error) {
        console.error('Error fetching blog for edit:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle updating a blog
router.post('/edit/:id', async (req, res) => {
    const blogId = req.params.id;
    const { title, content, author } = req.body;
    try {
        await pool.query('UPDATE blog SET title = $1, content = $2, author = $3 WHERE blog_id = $4',
            [title, content, author, blogId]);

        res.redirect('/dashboard/blogs'); // Redirect to blogs list after editing
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle deleting a blog
router.post('/delete/:id', async (req, res) => {
    const blogId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM blog WHERE blog_id = $1', [blogId]);

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
