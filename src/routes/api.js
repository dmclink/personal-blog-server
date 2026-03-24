const express = require('express');
const router = express.Router();

const authRouter = require('./auth.js');
const postsRouter = require('./posts.js');
const commentsRouter = require('./comments.js');

router.use('/auth', authRouter);
router.use('/posts', postsRouter);
router.use('/comments', commentsRouter);

module.exports = router;
