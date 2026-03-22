const express = require('express');
const router = express.Router();
const passport = require('../config/passport.js');

const { getAllPublishedPosts, addNewPost, upgradeUserPostPrivilege } = require('../db/queries.js');

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const posts = await getAllPublishedPosts();

		res.json({ success: true, data: { posts } });
	} catch (err) {
		console.error(err);
		throw err;
	}
});

async function canPost(req, res, next) {
	const user = req.user;

	if (!user.can_post) {
		next(new Error('user does not have post privileges. can only view'));
	}
	if (!user.email_verified) {
		next(new Error("user hasn't verified email yet, follow verification process!"));
	}

	next();
}

router.post('/create', passport.authenticate('jwt', { session: false }), canPost, async (req, res) => {
	if (!req.body) {
		res.json({ success: false, error: { message: 'missing request body' } });
		return;
	}
	const shouldPublish = req.query.publish;
	const title = req.body.title;
	const content = req.body.content;
	const authorId = req.user.id;

	if (!title || !content) {
		res.json({ success: false, error: { message: 'missing title or content from new post' } });
		return;
	}

	if (!authorId) {
		res.json({ success: false, error: { message: 'who are you? go login' } });
		return;
	}

	const newPost = await addNewPost({
		title,
		content,
		author_id: authorId,
		published_at: shouldPublish ? new Date() : null,
	});

	console.log('new post created:', newPost);

	res.json({ success: true, message: 'new post created' });
});

module.exports = router;
