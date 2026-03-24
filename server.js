const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const { Resend } = require("resend");
require("dotenv").config();

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
    console.log("📥 BODY:", req.body);
    console.log("📎 FILES:", req.files);

    const { name, email, phone, message } = req.body;

    // =======================
    // SAVE TO DATABASE
    // =======================
    try {
      await new Application({ name, email, phone, message }).save();
      console.log("✅ Saved to database");
    } catch (dbErr) {
      console.log("❌ DB ERROR:", dbErr);
    }

    // =======================
    // PREPARE ATTACHMENTS
    // =======================
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

    // =======================
    // SEND EMAIL
    // =======================
    const emailResponse = await resend.emails.send({
      from: "onboarding@resend.dev", // change if you have domain
      to: "your@email.com", // 🔥 CHANGE THIS
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

    console.log("📨 EMAIL RESPONSE:", emailResponse);

    // =======================
    // CLEAN UP FILES (SAFE)
    // =======================
    try {
      if (req.files?.cv) {
        fs.unlinkSync(req.files.cv[0].path);
      }

      if (req.files?.files) {
        req.files.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (cleanupErr) {
      console.log("⚠️ Cleanup error:", cleanupErr);
    }

    res.json({ success: true });

  } catch (error) {
    console.error("🔥 FULL ERROR:", error);
    res.status(500).json({ error: "Failed to send application" });
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
