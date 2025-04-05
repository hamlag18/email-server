const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

// CORS-konfiguration med alla headers som behövs
app.use(cors({
  origin: '*', // Tillåt alla origins under utveckling
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parser middleware
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Email server is running' });
});

// SMTP-transportör
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.USERNAME,
    pass: process.env.PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Lägg till denna för utveckling
  }
});

// Verifiera SMTP-anslutning vid start
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP-verifieringsfel:', error);
  } else {
    console.log('Server är redo att skicka e-post');
  }
});

// E-post endpoint
app.post('/', async (req, res) => {
  try {
    console.log('Tar emot förfrågan:', {
      recipient: req.body.recipient,
      subject: req.body.subject,
      contentLength: req.body?.content?.length
    });

    const { recipient, subject, content } = req.body;

    if (!recipient || !subject || !content) {
      console.error('Saknade fält:', { recipient, subject, content: !!content });
      return res.status(400).json({ 
        success: false, 
        error: 'Saknade fält i förfrågan' 
      });
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: recipient,
      subject: subject,
      text: content,
      html: content.replace(/\n/g, '<br>')
    };

    console.log('Skickar e-post till:', mailOptions.to);

    await transporter.sendMail(mailOptions);
    console.log('E-post skickad framgångsrikt');
    
    res.json({ 
      success: true, 
      message: 'E-post skickad framgångsrikt' 
    });
  } catch (error) {
    console.error('E-postfel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Serverfel:', err);
  res.status(500).json({
    success: false,
    error: 'Internt serverfel',
    details: err.message
  });
});

const port = process.env.PORT || 8080;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server körs på port ${port}`);
  console.log('Miljövariabler laddade:', {
    host: process.env.SMTP_HOST ? 'finns' : 'saknas',
    port: process.env.SMTP_PORT ? 'finns' : 'saknas',
    username: process.env.USERNAME ? 'finns' : 'saknas',
    password: process.env.PASSWORD ? 'finns' : 'saknas',
    fromEmail: process.env.FROM_EMAIL ? 'finns' : 'saknas'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal mottagen. Stänger ner servern...');
  server.close(() => {
    console.log('Server avstängd');
    process.exit(0);
  });
});