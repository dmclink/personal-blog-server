const express = require('express');
const router = express.Router();

const authRouter = require('./auth.js');
const postsRouter = require('./posts.js');

router.use('/auth', authRouter);
router.use('/posts', postsRouter);

module.exports = router;
