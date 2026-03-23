const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

// File upload setup
const upload = multer({ dest: "uploads/" });

// Email transporter
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

// Form route
app.post("/send", upload.fields([
  { name: "cv", maxCount: 1 },
  { name: "otherFiles", maxCount: 5 }
]), async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    let attachments = [];

    if (req.files["cv"]) {
      attachments.push({
        filename: req.files["cv"][0].originalname,
        path: req.files["cv"][0].path
      });
    }

    if (req.files["otherFiles"]) {
      req.files["otherFiles"].forEach(file => {
        attachments.push({
          filename: file.originalname,
          path: file.path
        });
      });
    }

    // Send to YOU
    await transporter.sendMail({
      from: email,
      to: "goodmanagement29@gmail.com",
      subject: "New Application - The Good Management Company",
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}
      `,
      attachments
    });

    // Auto reply
    await transporter.sendMail({
      from: "goodmanagement29@gmail.com",
      to: email,
      subject: "Application Received",
      text: `Hi ${name},\n\nThanks for applying! We’ll be in touch soon.\n\n- The Good Management Company`
    });

    res.send("✅ Application submitted successfully!");

  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error sending application.");
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
