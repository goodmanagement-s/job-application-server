const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { Resend } = require("resend");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup
const upload = multer({ dest: "uploads/" });

// Resend setup (uses environment variable)
const resend = new Resend(process.env.RESEND_API_KEY);

// ROUTE
app.post("/send", upload.fields([
  { name: "cv", maxCount: 1 },
  { name: "otherFiles", maxCount: 5 }
]), async (req, res) => {

  try {
    const { name, email, phone, message } = req.body;

    let attachments = [];
    let filePaths = []; // to delete later

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

    // SEND EMAIL TO YOU
    await resend.emails.send({
      from: "The Good Management <onboarding@resend.dev>",
      to: "goodmanagement29@gmail.com",
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

    // AUTO REPLY TO USER
    await resend.emails.send({
      from: "The Good Management <onboarding@resend.dev>",
      to: email,
      subject: "Application Received",
      text: `
Hi ${name},

Thank you for applying to our Management Development Program.

We’ve received your application and our team will review it shortly.

Kind regards,
The Good Management Company
      `
    });

    // CLEAN UP FILES (delete from server)
    filePaths.forEach(path => {
      try {
        fs.unlinkSync(path);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    });

    res.send("✅ Application submitted successfully!");

  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error sending application.");
  }
});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
