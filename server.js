require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const { Resend } = require("resend");

const app = express();

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());

// =======================
// FILE UPLOAD SETUP
// =======================
const upload = multer({ dest: "uploads/" });

// =======================
// RESEND SETUP
// =======================
const resend = new Resend(process.env.RESEND_API_KEY);

// =======================
// MONGODB CONNECTION
// =======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// =======================
// SCHEMA
// =======================
const applicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Application = mongoose.model("Application", applicationSchema);

// =======================
// ROUTE: SUBMIT APPLICATION
// =======================
app.post("/send", upload.fields([
  { name: "cv", maxCount: 1 },
  { name: "files", maxCount: 5 }
]), async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Save to DB
    await new Application({ name, email, phone, message }).save();

    // Prepare attachments
    const attachments = [];

    if (req.files?.cv) {
      const file = req.files.cv[0];
      attachments.push({
        filename: file.originalname,
        content: fs.readFileSync(file.path)
      });
    }

    if (req.files?.files) {
      req.files.files.forEach(file => {
        attachments.push({
          filename: file.originalname,
          content: fs.readFileSync(file.path)
        });
      });
    }

    // Send email
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.EMAIL_TO, // safer
      subject: "New Job Application",
      html: `
        <h2>New Application</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b> ${message}</p>
      `,
      attachments
    });

    // Cleanup files
    if (req.files?.cv) fs.unlinkSync(req.files.cv[0].path);
    if (req.files?.files) {
      req.files.files.forEach(file => fs.unlinkSync(file.path));
    }

    res.json({ success: true });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({ error: "Failed to send application" });
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
