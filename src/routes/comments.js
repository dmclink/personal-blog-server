const express = require('express');
const router = express.Router();

const passport = require('../config/passport.js');

const { canComment, checkMissingRequestBody } = require('./middleware.js');
const { getCommentsForPost, addComment, isPublishedPost, userCanEditComment } = require('../db/queries.js');

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
	checkMissingRequestBody,
	passport.authenticate('jwt', { session: false }),
	canComment,
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
	},
);

router.post(
	'/edit',
	checkMissingRequestBody,
	passport.authenticate('jwt', { session: false }),
	canComment,
	async (req, res, next) => {
		const commentId = req.body.comment_id;
		if (!commentId) {
			res.json({ success: false, error: { message: 'missing comment_id' } });
			return;
		}
		if (isNaN(commentId)) {
			res.json({ success: false, error: { message: 'comment_id must be a number' } });
			return;
		}

		const content = req.body.content;
        if (!content) {
			res.json({ success: false, error: { message: 'must include content field in request with updated comment text' });
			return;
        }

		try {
			const canEdit = await userCanEditComment(req.user.id, commentId);
			if (!canEdit) {
				res.json({
					success: false,
					error: {
						message: "you can't edit other people's comments",
					},
				});
				return;
			}

			await editComment(commentId, content);
            res.json({success: true, message: 'comment updated'})
		} catch (err) {
			next(err);
		}
	},
);

module.exports = router;
