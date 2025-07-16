const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const upload = multer();
const nodemailer = require("nodemailer");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..")));

// MongoDB setup
const client = new MongoClient(process.env.MONGO_URI);
let db;
client.connect().then(() => {
  db = client.db("puretential");
  console.log("Connected to MongoDB");
});

// Contact form route (with multer for multipart/form-data)
app.post("/contact", upload.none(), (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).send("All contact fields are required.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `Contact Form: ${subject}`,
    text: `${name} (${email}): ${message}`,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error sending mail");
    }
    res.send("Message sent successfully");
  });
});

// Booking form route (with multer for multipart/form-data)
app.post("/booking", upload.none(), async (req, res) => {
  const { name, phone, address, service, date } = req.body;

  if (!name || !phone || !address || !service || !date) {
    return res.status(400).send("All booking fields are required.");
  }

  try {
    // Save to MongoDB
    await db.collection("bookings").insertOne({ name, phone, address, service, date });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Booking: ${name}`,
      text: `New booking details:\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nService: ${service}\nDate: ${date}`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error sending booking email");
      }
      res.send("Booking received!");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing booking");
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
