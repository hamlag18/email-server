const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Skapa en SMTP-transportör med dina befintliga miljövariabler
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // smtp.gmail.com
  port: process.env.SMTP_PORT,      // 587
  secure: false,                    // true för port 465, false för andra portar
  auth: {
    user: process.env.USERNAME,     // tidrapport1157@gmail.com
    pass: process.env.PASSWORD      // vjqt bfpx zouo yrzz
  }
});

// E-post endpoint
app.post('/', async (req, res) => {
  try {
    console.log('Tar emot förfrågan:', req.body);
    const { recipient, subject, content } = req.body;

    if (!recipient || !subject || !content) {
      console.error('Saknade fält:', { recipient, subject, content: !!content });
      return res.status(400).json({ 
        success: false, 
        error: 'Saknade fält i förfrågan' 
      });
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL,  // tidrapport1157@gmail.com
      to: recipient,
      subject: subject,
      text: content,
      html: content.replace(/\n/g, '<br>')
    };

    console.log('Skickar e-post med följande alternativ:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      contentLength: content.length
    });

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server körs på port ${port}`);
  console.log('Miljövariabler laddade:', {
    host: process.env.SMTP_HOST ? 'finns' : 'saknas',
    port: process.env.SMTP_PORT ? 'finns' : 'saknas',
    username: process.env.USERNAME ? 'finns' : 'saknas',
    password: process.env.PASSWORD ? 'finns' : 'saknas',
    fromEmail: process.env.FROM_EMAIL ? 'finns' : 'saknas'
  });
});