const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
    getAllDoctors,
    getDoctorById,
    addDoctor,
    updateDoctor,
    deleteDoctor,
} = require("../controllers/doctorController");

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/uploads/"),
    filename: (req, file, cb) =>
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`),
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    mimetype && extname ? cb(null, true) : cb("Error: Images only!");
};
const upload = multer({ storage, fileFilter }).single("image");

// Routes
router.get("/", getAllDoctors); // List all doctors
router.get("/add", (req, res) =>
    res.render("admin/doctors", { action: "add", pageTitle: "Add Doctor Profile" })
); // Render add form
router.post("/add", upload, addDoctor); // Add a doctor
router.get("/edit/:id", getDoctorById); // Render edit form
router.post("/edit/:id", upload, updateDoctor); // Update doctor
router.post("/delete/:id", deleteDoctor); // Delete doctor

module.exports = router;
