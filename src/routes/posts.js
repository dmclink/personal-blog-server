const express = require('express');
const router = express.Router();
const passport = require('../config/passport.js');

const { canPost, checkMissingRequestBody } = require('./middleware.js');
const {
	getAllPublishedPosts,
	addNewPost,
	upgradeUserPostPrivilege,
	getPostById,
	getPublishedPostById,
	publishPost,
	editPost,
	deletePost,
	getUserDrafts,
} = require('../db/queries.js');

router.get('/', async (req, res) => {
	try {
		const posts = await getAllPublishedPosts();

		res.json({ success: true, data: { posts } });
	} catch (err) {
		console.error(err);
		throw err;
	}
});

router.post(
	'/create',
	passport.authenticate('jwt', { session: false }),
	canPost,
	checkMissingRequestBody,
	async (req, res) => {
		const shouldPublish = req.query.publish;
		const title = req.body.title;
		const content = req.body.content;
		const description = req.body.description;
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
			description,
			author_id: authorId,
			published_at: shouldPublish ? new Date() : null,
		});

		console.log('new post created:', newPost);

		res.json({ success: true, message: 'new post created' });
	},
);

router.post(
	'/publish-draft',
	passport.authenticate('jwt', { session: false }),
	canPost,
	checkMissingRequestBody,
	async (req, res) => {
		try {
			const postId = req.body.post_id;
			if (!postId) {
				throw new Error('missing post id');
			}

			const post = await getPostById(postId);
			const published = Boolean(post.published_at);

			if (published) {
				res.json({ success: false, error: { message: 'post is already published' } });
				return;
			}

			await publishPost(postId);
			res.json({ success: true, message: 'post published' });
		} catch (err) {
			console.error(err);
			res.json({ success: false, error: { message: 'something went wrong, check your post ID and try again' } });
		}
	},
);

router.post(
	'/edit',
	passport.authenticate('jwt', { session: false }),
	canPost,
	checkMissingRequestBody,
	async (req, res) => {
		const postId = req.body.post_id;
		const title = req.body.title;
		const content = req.body.content;
		const description = req.body.description;

		if (!postId) {
			res.json({ success: false, error: { message: 'missing post id' } });
			return;
		}

		if (!title && !content && !description) {
			res.json({
				success: false,
				error: {
					message: 'missing update information, must include either new title, content, or description',
				},
			});
			return;
		}

		try {
			await editPost(postId, title, content, description);
			res.json({ success: true, message: 'post updated' });
		} catch (err) {
			console.error(err);
			throw err;
		}
	},
);

router.post(
	'/delete',
	passport.authenticate('jwt', { session: false }),
	canPost,
	checkMissingRequestBody,
	async (req, res, next) => {
		try {
			const postId = req.body.post_id;
			if (!postId) {
				res.json({ success: false, error: { message: 'missing post_id field in request body' } });
				return;
			}

			await deletePost(postId);
			res.json({ success: true, message: 'deleted that post' });
		} catch (err) {
			console.error(err);
			next(new Error('something went wrong editing post'));
		}
	},
);

router.get('/drafts', passport.authenticate('jwt', { session: false }), canPost, async (req, res, next) => {
	const userId = req.user.id;

	try {
		const drafts = await getUserDrafts(userId);

		res.json({ success: true, data: { drafts } });
	} catch (err) {
		console.error(err);
		next(new Error('something went wrong getting user drafts'));
	}
});

router.get('/view/:id', async (req, res, next) => {
	const postId = Number(req.params.id);

	try {
		const post = await getPublishedPostById(postId);

		if (!post) {
			res.json({ success: false, error: { message: 'no published post with id:', postId } });
			return;
		}

		res.json({ success: true, data: { post } });
	} catch (err) {
		console.error(err);
		next(new Error('something went wrong fetching post'));
	}
});

module.exports = router;
