const pool = require('../models/db');

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

function ensureSuperAdmin(req, res, next) {
    pool.query(`SELECT is_super_admin FROM admins WHERE id = $1`, [req.session.userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("An error occurred");
        }

        if (result.rows.length === 0 || !result.rows[0].is_super_admin) {
            return res.status(403).send("Forbidden: Requires Super Admin access");
        }
        
        next();
    });
}

module.exports = { isAuthenticated, ensureSuperAdmin };
