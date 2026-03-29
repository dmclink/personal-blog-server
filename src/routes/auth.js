const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const passport = require('../config/passport.js');
const nodemailer = require('../config/nodemailer.js');

const {
	addUser,
	emailExists,
	usernameExists,
	userEmailVerified,
	getUserByUsername,
	updateEmailSentTime,
} = require('../db/queries.js');
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
			throw new Error('incorrect password');
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

	if (await emailExists(email)) {
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

	const lastEmailSentAt = Date.parse(user.email_sent_at);
	const emailSendCooldown = 1000 * 60 * 15; // 15 minutes

	// prevent users spamming verification emails
	if (new Date() < new Date(lastEmailSentAt + emailSendCooldown)) {
		const err = new Error('verification email still on cooldown: ', userId);
		console.error(err);
		res.json({
			success: false,
			error: {
				message:
					'verification email already sent, please check your inbox or wait at least 15 minutes to send again',
			},
		});
		return;
	}

	const tokenPayload = {
		user_id: userId,
		email: userEmail,
		iss: 'https://www.github.com/dmclink/personal-blog-server',
		aud: 'personal-blog-user',
	};

	const token = jwt.sign(tokenPayload, process.env.PERSONAL_BLOG_JWT_SECRET_KEY, {
		expiresIn: '15m',
	});

	const link = `${process.env.HOST}:${process.env.PORT}/api/auth/confirm-email?token=${token}`;
	nodemailer.sendMail(
		{
			from: `"Personal Blog Email Verification" <${process.env.NODEMAILER_GMAIL_USER}>`,
			to: userEmail,
			subject: "Verify your email for dmclink's personal blog page",
			html: `
				<h1>Verify your email</h1>
				<p>click the link below to confirm</p>
				<p>link expires in 15 minutes<p>
				<p><a href="${link}">${link}</a></p>
			`,
		},
		async (err, info) => {
			if (err) {
				console.error(err);
				return err;
			}
			console.log('message sent, info:', info);

			try {
				await updateEmailSentTime(userId);
			} catch (err) {
				console.error(err);
				return err;
			}
		},
	);
	res.json({ success: true, message: 'verification email sent. check your spam folder' });
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
