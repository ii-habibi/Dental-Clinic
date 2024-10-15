const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

// Initialize app
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Session setup for flash messages
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.use(flash());

// Routes
app.use('/dashboard', adminRoutes);//admin
app.use('/', userRoutes); //user

// Handle 404 errors
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});


app.get('/', (req, res) => {
    res.send('Server is running');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}/`);
});
