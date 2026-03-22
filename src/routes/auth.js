const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const passport = require('../config/passport.js');

const { addUser, emailExists, usernameExists, getUsers } = require('../db/queries.js');
const { verifyPassword, buildUserAuthToken } = require('../lib/authutils.js');

router.post('/login', async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;

	try {
		const user = await db.getUserByUsername(username);
		const token = buildUserAuthToken(user);

		res.json({
			success: true,
			token: 'Bearer ' + token,
		});
	} catch (err) {
		console.error(err);
		res.json({ error: { message: 'incorrect username or password' } });
	}
});

router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
	console.log('REQ.USER:', req.user);
	res.send("cool, you're authenticated, nice\n");
});

router.post('/register', async (req, res) => {
	const email = req.body.email;
	const username = req.body.username;
	const password = req.body.password;

	if (!email || !username || !password) {
		res.send('hey you didnt fill out all the data, try again\n');
		return;
	}
	const users = await getUsers();
	console.log('email, username, pass:', email, username, password);
	console.log('ALL USERS:', users);

	if (await usernameExists(username)) {
		res.send('that username already exists, pick another one\n');
		return;
	}

	if (await emailExists(username)) {
		res.send('that email already exists, pick another one\n');
		return;
	}

	const user = await addUser(email, username, password);

	const token = buildUserAuthToken(user);

	res.json({
		success: true,
		token: 'Bearer ' + token,
	});
});

router.get('/verify-email', passport.authenticate('jwt', { session: false }), (req, res) => {});

module.exports = router;
