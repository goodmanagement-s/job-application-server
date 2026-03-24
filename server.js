const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const { Resend } = require("resend");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup
const upload = multer({ dest: "uploads/" });

// Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// MongoDB connection (FIXED - no deprecated options)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Schema
const applicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Application = mongoose.model("Application", applicationSchema);

// ROUTE: Submit application
app.post("/send", upload.fields([
  { name: "cv", maxCount: 1 },
  { name: "files", maxCount: 5 }
]), async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Save to database
    const newApp = new Application({
      name,
      email,
      phone,
      message
    });

    await newApp.save();

    // Prepare attachments
    const attachments = [];

    if (req.files["cv"]) {
      const file = req.files["cv"][0];
      attachments.push({
        filename: file.originalname,
        content: fs.readFileSync(file.path)
      });
    }

    if (req.files["files"]) {
      req.files["files"].forEach(file => {
        attachments.push({
          filename: file.originalname,
          content: fs.readFileSync(file.path)
        });
      });
    }

    // Send email
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "goodmanagement29@gmail.com", // 🔥 CHANGE THIS
      subject: "New Job Application",
      html: `
        <h2>New Application</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
      attachments
    });

    // Clean up uploaded files
    attachments.forEach(file => {
      try {
        fs.unlinkSync(`uploads/${file.filename}`);
      } catch {}
    });

    res.json({ success: true });

  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ error: "Failed to send application" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
