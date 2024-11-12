const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const pool = require('../models/db');
const { ensureSuperAdmin } = require('../middleware/auth');

// Super Admin adding a new admin
router.post('/add-admin', ensureSuperAdmin, async (req, res) => {
    const { name, username, password, isSuperAdmin } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO admins (name, username, password, is_super_admin) VALUES ($1, $2, $3, $4)`,
            [name, username, hashedPassword, isSuperAdmin]
        );
        res.send("Admin added successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred");
    }
});

// Super Admin deleting an admin
router.post('/delete-admin', ensureSuperAdmin, async (req, res) => {
    const { adminId, password } = req.body;
    console.log("Request received to delete admin with ID:", adminId);  // Debugging
    try {
        const result = await pool.query(`SELECT is_super_admin FROM admins WHERE id = $1`, [adminId]);
        const isSuperAdmin = result.rows[0]?.is_super_admin;
        console.log("Is target admin a Super Admin:", isSuperAdmin); // Debugging

        if (isSuperAdmin) {
            if (!password) {
                return res.status(400).send("Password is required for deleting a Super Admin.");
            }
            
            const superAdminResult = await pool.query(`SELECT password FROM admins WHERE id = $1`, [req.session.userId]);
            const superAdminPassword = superAdminResult.rows[0].password;

            const isMatch = await bcrypt.compare(password, superAdminPassword);
            if (!isMatch) {
                return res.status(403).send("Incorrect password.");
            }
        }

        await pool.query(`DELETE FROM admins WHERE id = $1`, [adminId]);
        res.send("Admin deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred");
    }
});

// Super Admin updating their own credentials with password check
router.post('/update-super-admin', ensureSuperAdmin, async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    try {
        const result = await pool.query(`SELECT password FROM admins WHERE id = $1 AND is_super_admin = TRUE`, [req.session.userId]);
        const user = result.rows[0];
        
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).send("Incorrect current password");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await pool.query(
            `UPDATE admins SET username = $1, password = $2 WHERE id = $3 AND is_super_admin = TRUE`,
            [username, hashedPassword, req.session.userId]
        );
        res.send("Super Admin updated successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred");
    }
});

// Route to fetch all admins
router.get('/admins', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, name, is_super_admin FROM admins');
        const admins = result.rows;
        res.json(admins);
    } catch (err) {
        console.error('Error fetching admins:', err);
        res.status(500).json({ message: 'Failed to fetch admins' });
    }
});

// Login Route
router.get('/login', (req, res) => res.render('admin/login'));

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(`SELECT * FROM admins WHERE username = $1`, [username]);
        const user = result.rows[0];

        if (!user) {
            res.json({ success: false, message: 'User not found' });
        } else if (!(await bcrypt.compare(password, user.password))) {
            res.json({ success: false, message: 'Invalid password' });
        } else {
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.name = user.name;
            res.json({ success: true });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'An error occurred. Please try again.' });
    }
});


// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/login');
    });
});

module.exports = router;
