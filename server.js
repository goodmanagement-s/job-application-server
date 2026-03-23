const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve your frontend (index.html)
app.use(express.static(path.join(__dirname)));

// File upload setup
const upload = multer({ dest: "uploads/" });

// ✅ EMAIL SETUP (FIXED FOR RENDER)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // IMPORTANT
  auth: {
    user: "goodmanagement29@gmail.com",   // YOUR EMAIL
    pass: "YOUR_APP_PASSWORD"             // YOUR APP PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ✅ TEST ROUTE (fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🚀 FORM SUBMISSION ROUTE
app.post(
  "/send",
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "otherFiles", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const { name, email, phone, message } = req.body;

      let attachments = [];

      // CV upload
      if (req.files["cv"]) {
        attachments.push({
          filename: req.files["cv"][0].originalname,
          path: req.files["cv"][0].path
        });
      }

      // Other files upload
      if (req.files["otherFiles"]) {
        req.files["otherFiles"].forEach(file => {
          attachments.push({
            filename: file.originalname,
            path: file.path
          });
        });
      }

      // 📩 SEND EMAIL TO YOU
      await transporter.sendMail({
        from: `"Job Application" <goodmanagement29@gmail.com>`,
        to: "goodmanagement29@gmail.com", // where YOU receive applications
        subject: "New Application - The Good Management Company",
        text: `
New Applicant Details:

Name: ${name}
Email: ${email}
Phone: ${phone}

Why they are interested:
${message}
        `,
        attachments
      });

      // 📩 AUTO-REPLY TO APPLICANT
      await transporter.sendMail({
        from: `"The Good Management Company" <goodmanagement29@gmail.com>`,
        to: email,
        subject: "Application Received - The Good Management Company",
        text: `
Hi ${name},

Thank you for applying to our Management Development Program.

We’ve received your application and our team will review it shortly.

We appreciate your interest in building a leadership career with us.

Kind regards,  
The Good Management Company
        `
      });

      res.send("✅ Application submitted successfully!");
    } catch (error) {
      console.error("❌ ERROR:", error);
      res.status(500).send("❌ Error sending application.");
    }
  }
);

// 🌐 PORT FIX FOR RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
