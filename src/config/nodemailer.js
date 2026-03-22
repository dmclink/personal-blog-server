const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.NODEMAILER_GMAIL_USER,
		pass: process.env.NODEMAILER_GMAIL_APP_PASS,
	},
});

module.exports = transporter;
