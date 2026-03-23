const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
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
    pass: "X!69Catwalk"             // YOUR APP PASSWORD
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

      // SEND TO YOU
await resend.emails.send({
  from: "onboarding@resend.dev",
  to: "goodmanagement29@gmail.com",
  subject: "New Application - The Good Management Company",
  text: `
Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}
  `
});

// AUTO REPLY
await resend.emails.send({
  from: "onboarding@resend.dev",
  to: email,
  subject: "Application Received",
  text: `Hi ${name}, thanks for applying! We’ll be in touch soon.`
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
