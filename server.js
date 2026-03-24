const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const { Resend } = require("resend");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File upload
const upload = multer({ dest: "uploads/" });

// ✅ CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Schema
const applicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  files: [String],
  createdAt: { type: Date, default: Date.now }
});

const Application = mongoose.model("Application", applicationSchema);

// ✅ RESEND SETUP
const resend = new Resend(process.env.RESEND_API_KEY);

// 🚀 FORM ROUTE
app.post("/send", upload.fields([
  { name: "cv", maxCount: 1 },
  { name: "otherFiles", maxCount: 5 }
]), async (req, res) => {

  try {
    const { name, email, phone, message } = req.body;

    let attachments = [];
    let filePaths = [];

    // CV
    if (req.files["cv"]) {
      const file = req.files["cv"][0];

      attachments.push({
        filename: file.originalname,
        content: fs.readFileSync(file.path)
      });

      filePaths.push(file.path);
    }

    // Other files
    if (req.files["otherFiles"]) {
      req.files["otherFiles"].forEach(file => {
        attachments.push({
          filename: file.originalname,
          content: fs.readFileSync(file.path)
        });

        filePaths.push(file.path);
      });
    }

    // ✅ SAVE TO DATABASE
    const fileNames = attachments.map(file => file.filename);

    await Application.create({
      name,
      email,
      phone,
      message,
      files: fileNames
    });

    // 📩 SEND EMAIL TO YOU
    await resend.emails.send({
      from: "The Good Management <onboarding@resend.dev>",
      to: "goodmanagement29@gmail.com",
      subject: "New Application - The Good Management Company",
      text: `
New Applicant Details:

Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}
      `,
      attachments
    });

    // 📧 AUTO REPLY
    await resend.emails.send({
      from: "The Good Management <onboarding@resend.dev>",
      to: email,
      subject: "Application Received",
      text: `
Hi ${name},

Thank you for applying to our Management Development Program.

We’ve received your application and will review it shortly.

Kind regards,
The Good Management Company
      `
    });

    // 🧹 CLEAN UP FILES
    filePaths.forEach(path => {
      try {
        fs.unlinkSync(path);
      } catch (err) {
        console.error("Delete error:", err);
      }
    });

    res.send("✅ Application submitted successfully!");

  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).send("❌ Error sending application.");
  }
});

// 📊 ADMIN ROUTE (VIEW APPLICATIONS)
app.get("/applications", async (req, res) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).send("Error fetching applications");
  }
});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
