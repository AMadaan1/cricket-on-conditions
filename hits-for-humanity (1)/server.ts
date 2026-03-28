import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Database from "better-sqlite3";

dotenv.config();

// Initialize SQLite database
const db = new Database("hits_for_humanity.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    predictions TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending donation emails
  app.post("/api/notify-donation", async (req, res) => {
    const { userEmail } = req.body;
    const adminEmail = "arjunmadaan29@gmail.com";

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Hits for Humanity" <${process.env.SMTP_USER || "noreply@example.com"}>`,
      to: [adminEmail, userEmail].filter(Boolean).join(", "),
      subject: "Donation Initiated for Stanford HAI!",
      text: `A donation has been initiated for Stanford University: Human-Centered Artificial Intelligence (HAI). Please remember to send your receipt to arjunmadaan29@gmail.com to be considered in the Hits for Humanity challenge.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #141414;">
          <h2 style="font-style: italic; color: #141414;">Hits for Humanity</h2>
          <p>A donation has been initiated for <strong>Stanford University: Human-Centered Artificial Intelligence (HAI)</strong>.</p>
          <p style="background: #f5f5f5; padding: 15px; border-left: 4px solid #141414;">
            <strong>Action Required:</strong> To be considered in the challenge, please forward your donation receipt from Stanford to <strong>arjunmadaan29@gmail.com</strong>.
          </p>
          <p>Thank you for supporting human-centered AI research through Hits for Humanity!</p>
        </div>
      `,
    };

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false });
    }
  });

  // API Route for submitting bracket
  app.post("/api/submit-bracket", async (req, res) => {
    const { userEmail, predictions } = req.body;
    
    if (!userEmail || !predictions || typeof predictions !== 'object') {
      return res.status(400).json({ success: false, error: "Invalid submission" });
    }

    try {
      const stmt = db.prepare("INSERT INTO submissions (email, predictions) VALUES (?, ?)");
      stmt.run(userEmail, JSON.stringify(predictions));
      res.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ success: false });
    }
  });

  // API Route for admin data
  app.get("/api/admin/submissions", async (req, res) => {
    const password = req.headers["x-admin-password"];
    const correctPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== correctPassword) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    try {
      const rows = db.prepare("SELECT * FROM submissions ORDER BY submitted_at DESC").all();
      const submissions = rows.map((row: any) => ({
        userEmail: row.email,
        predictions: JSON.parse(row.predictions),
        timestamp: row.submitted_at
      }));
      res.json({ success: true, submissions });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ success: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
