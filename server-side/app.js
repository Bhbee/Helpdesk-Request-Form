require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.static('../client-side')); // Serve static files from client-side
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('Database connected!');
});

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send email notifications
function sendEmailNotification(req) {
    const { staff_name, staff_id, department, issue_type, priority_level, description, landline_number } = req.body;
    const issueTypes = Array.isArray(issue_type) ? issue_type.join(', ') : issue_type;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'bhbeex@gmail.com', // Helpdesk email address
        subject: `New Helpdesk Request - ${staff_id}`,
        text: `
            New Helpdesk Request Submitted\n
            Staff Name: ${staff_name}
            Staff ID: ${staff_id}
            Department: ${department}
            Issue Type: ${issueTypes}
            Priority: ${priority_level}
            Description: ${description}
            Landline Number: ${landline_number}
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error occurred while sending email:', error);
        } else {
            console.log('Email sent successfully:', info.response);
        }
    });
}

// Route to handle form submission
app.post('/submit-request', (req, res) => {
    const { staff_name, staff_id, department, issue_type, priority_level, description, landline_number } = req.body;
    const issueTypes = Array.isArray(issue_type) ? issue_type.join(', ') : issue_type;

    const sql = 'INSERT INTO requests (staff_name, staff_id, department, issue_type, priority_level, description, landline_number) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [staff_name, staff_id, department, issueTypes, priority_level, description, landline_number], (err) => {
        if (err) {
            console.error('Error inserting request:', err);
            return res.status(500).send('Error submitting request');
        }

        // Send the email notification after successful insertion
        sendEmailNotification(req);
        res.send('Request submitted successfully!');
    });
});


// Route to serve the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client-side/admin.html')); // Serve the admin.html file
});

// API endpoint to fetch requests
app.get('/api/requests', (req, res) => {
    const days = req.query.days;

    let sql = 'SELECT * FROM requests';
    if (days) {
        // Assuming you have a 'created_at' column in your requests table
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        sql += ' WHERE created_at >= ?';
        db.query(sql, [dateThreshold], (err, results) => {
            if (err) {
                return res.status(500).send('Error fetching requests');
            }
            res.json(results);
        });
    } else {
        db.query(sql, (err, results) => {
            if (err) {
                return res.status(500).send('Error fetching requests');
            }
            res.json(results);
        });
    }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
