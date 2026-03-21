const express = require('express');
const router = express.Router();

const passport = require('../config/passport.js');

router.post('/login', (req, res) => {
	res.send('you logged in, nice\n');
	//TODO:
});

module.exports = router;
