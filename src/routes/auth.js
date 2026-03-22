const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const passport = require('../config/passport.js');
const nodemailer = require('../config/nodemailer.js');

const { addUser, emailExists, usernameExists, userEmailVerified, getUserByUsername } = require('../db/queries.js');
const { verifyPassword, buildUserAuthToken } = require('../lib/authutils.js');

router.post('/login', async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;

	if (!username || !password) {
		res.json({ success: false, error: { message: 'missing username or password' } });
		return;
	}

	try {
		const user = await getUserByUsername(username);
		if (!user) {
			throw new Error('no username exists:', username);
		}

		const verified = await verifyPassword(user.id, password);
		if (!verified) {
			throw new Error('incorrect password:', password);
		}

		const token = buildUserAuthToken(user);

		res.json({
			success: true,
			token: 'Bearer ' + token,
		});
	} catch (err) {
		console.error(err);
		res.json({ success: false, error: { message: 'incorrect username or password' } });
	}
});

router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
	res.send({ success: true, message: "cool, you're authenticated, nice\n" });
});

router.post('/register', async (req, res) => {
	const email = req.body.email;
	const username = req.body.username;
	const password = req.body.password;

	if (!email || !username || !password) {
		res.json({ success: false, error: { message: 'hey you didnt fill out all the data, try again\n' } });
		return;
	}

	if (await usernameExists(username)) {
		res.json({ success: false, error: { message: 'that username already exists, pick another one\n' } });
		return;
	}

	if (await emailExists(username)) {
		res.json({ success: false, error: { message: 'that email already exists, pick another one\n' } });
		return;
	}

	const user = await addUser(email, username, password);

	const token = buildUserAuthToken(user);

	res.json({
		success: true,
		token: 'Bearer ' + token,
	});
});

router.get('/verify-email', passport.authenticate('jwt', { session: false }), (req, res) => {
	const user = req.user;
	const userEmail = user.email;
	const userId = user.id;

	const payload = {
		user_id: user.id,
		email: userEmail,
		iss: 'https://www.github.com/dmclink/personal-blog-server',
		aud: 'personal-blog-user',
	};

	const token = jwt.sign(payload, process.env.PERSONAL_BLOG_JWT_SECRET_KEY, {
		expiresIn: '15m',
	});

	const link = `${process.env.HOST}:${process.env.PORT}/api/auth/confirm-email?token=${token}`;
	nodemailer.sendMail(
		{
			from: `"Personal Blog Email Verification" <${process.env.NODEMAILER_OUTLOOK_USER}>`,
			to: userEmail,
			subject: 'Verify your email for the Personal Blog webpage - by dmclink',
			html: `
				<h1>Verify your email</h1>
				<p>click the link below to confirm</p>
				<p>link expires in 15 minutes<p>
				<a href="${link}">${link}</a>
			`,
		},
		(err, info) => {
			if (err) {
				return console.error(err);
			}
			console.log('message sent, info:', info);

			res.json({ success: true, message: 'verification email sent. check your spam folder' });
		},
	);
});

router.get('/confirm-email', async (req, res) => {
	const tokenStr = req.query.token;
	if (!tokenStr) {
		res.json({ success: false, error: { message: 'hey man you gotta follow the link to confirm your email' } });
		return;
	}

	const opts = {
		issuer: 'https://www.github.com/dmclink/personal-blog-server',
		audience: 'personal-blog-user',
	};
	const token = jwt.verify(tokenStr, process.env.PERSONAL_BLOG_JWT_SECRET_KEY, opts);

	const userId = token.user_id;
	const userEmail = token.email;

	try {
		await userEmailVerified(userId, userEmail);
		res.json({ success: true, message: 'user email verification confirmed' });
	} catch (err) {
		console.error(err);
		res.json({
			success: false,
			error: {
				message:
					'something went wrong verifying your email. go through the verification process again to get a new token and try again',
			},
		});
	}
});

module.exports = router;
