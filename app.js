const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();  // Load environment variables

const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');

// Initialize app
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security middlewares
// app.use(helmet());  // Secure HTTP headers

// Session setup with improved security
app.use(session({
    secret: process.env.SESSION_SECRET || 'TOPSECRET',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // Ensure secure cookies in production
        maxAge: 24 * 60 * 60 * 1000  // Session expires in 1 day
    }
}));

app.use(flash());

// Routes
app.use('/dashboard', adminRoutes); // Admin routes
app.use('/', userRoutes); // User routes
app.use(authRoutes); // Authentication routes

// Handle 404 errors
app.use((req, res) => {
    res.status(404).render('errors/error404');
});

// General error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging

    // Determine the status code
    const statusCode = err.status || (err.code >= 400 && err.code < 500 ? 400 : 500);
    
    // Set the response status
    res.status(statusCode);

    // Respond with a JSON object for API requests
    if (req.accepts('json')) {
        return res.json({ status: statusCode, message: err.message || 'An error occurred' });
    }

    // Render a custom error page for web requests
    res.render('error', { message: err.message || 'An error occurred' });
});

// Catch 404 errors
app.use((req, res, next) => {
    res.status(404).render('errors/error', { message: 'Page Not Founded' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/`);
});
