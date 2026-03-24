const express = require('express');
const router = express.Router();

const passport = require('../config/passport.js');

const { canComment, checkMissingRequestBody } = require('./middleware.js');
const { getCommentsForPost, userEmailVerified, addComment, isPublishedPost } = require('../db/queries.js');

router.get('/view/:postId', async (req, res) => {
	try {
		const postId = Number(req.params.postId);
		if (isNaN(postId)) {
			throw new Error('invalid postId, must be a number:', postId);
		}
		const comments = await getCommentsForPost(postId);

		res.json({ success: true, data: { comments } });
	} catch (err) {
		console.error(err);
		throw err;
	}
});

router.post(
	'/create',
	passport.authenticate('jwt', { session: false }),
	canComment,
	checkMissingRequestBody,
	async (req, res, next) => {
		try {
			const postId = Number(req.body.post_id);
			const content = req.body.content;
			const authorId = req.user.id;

			if (isNaN(postId)) {
				res.json({ success: false, error: { message: 'post_id must be a number' } });
				return;
			}

			if (!postId || !content) {
				res.json({ success: false, error: { message: 'missing request data. must have post_id and content' } });
				return;
			}

			const postExists = await isPublishedPost(postId);

			if (!postExists) {
				res.json({ success: false, error: { message: 'no published post with that ID exists' } });
				return;
			}

			const newComment = await addComment(authorId, postId, content);
			res.json({ success: true, message: 'new comment added', newComment });
			return;
		} catch (err) {
			next(err);
		}

		//TODO: implement posting comments on a post, then check get all posts to see if you can see the comments when you grab the post
	},
);

module.exports = router;
