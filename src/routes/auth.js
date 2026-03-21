const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const passport = require('../config/passport.js');

router.post('/login', (req, res) => {
	//FIXME: delete this and put a real one
	const payload = {
		id: 1,
		email: 'dmclink@gmail.com',
		iss: 'https://www.github.com/dmclink/personal-blog-server',
		aud: 'personal-blog-user',
	};

	//FIXME: change the expires time
	const token = jwt.sign(payload, process.env.PERSONAL_BLOG_JWT_SECRET_KEY, {
		expiresIn: '30s',
	});

	res.json({
		success: true,
		token: 'Bearer ' + token,
	});
});

router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
	console.log(req);
	res.send("cool, you're authenticated, nice\n");
	//TODO:
});

module.exports = router;
