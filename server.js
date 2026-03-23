const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer"); // ← THIS MUST BE HERE
const app = express();

app.use(cors());
app.use(express.json());
const app = express();
app.use(cors());


// Store uploaded files
const upload = multer({ dest: "uploads/" });

// 🔐 EMAIL SETUP (GMAIL)
const transporter = nodemailer.createTransport({
  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // VERY IMPORTANT (false for 587)
  auth: {
    user: "goodmanagement29@gmail.com",
    pass: "kpwa rjkm gskl jiac"
  }
});

// 🚀 FORM SUBMISSION ROUTE
app.post("/send", upload.fields([
  { name: "cv", maxCount: 1 },
  { name: "otherFiles", maxCount: 5 }
]), async (req, res) => {

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

    // ✉️ SEND EMAIL
    await transporter.sendMail({
      from: email,
      to: "goodmanagement29@gmail.com",  // <-- CHANGE THIS (where you receive applications)
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

// SEND EMAIL TO YOU
await transporter.sendMail({
  from: email,
  to: "YOUR_EMAIL@gmail.com",
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


// 👇 ADD THIS RIGHT HERE (AUTO REPLY)
await transporter.sendMail({
  from: "goodmanagement29@gmail.com",
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
    console.error(error);
    res.status(500).send("❌ Error sending application.");
  }
});

// 🌐 START SERVER
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
