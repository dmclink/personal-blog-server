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
	userOwnsPost,
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
	checkMissingRequestBody,
	passport.authenticate('jwt', { session: false }),
	canPost,
	async (req, res) => {
		const shouldPublish = req.query.publish;
		const title = req.body.title;
		const content = req.body.content;
		const description = req.body.description;
		const authorId = req.user.id;

		if (typeof title === 'undefined' || !content) {
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
	checkMissingRequestBody,
	passport.authenticate('jwt', { session: false }),
	canPost,
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
	checkMissingRequestBody,
	passport.authenticate('jwt', { session: false }),
	canPost,
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
			const canEdit = await userOwnsPost(req.user.id, postId);
			if (!canEdit) {
				res.json({
					success: false,
					error: {
						message: "you can't edit other people's posts",
					},
				});
				return;
			}
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
	checkMissingRequestBody,
	passport.authenticate('jwt', { session: false }),
	canPost,
	async (req, res, next) => {
		try {
			const postId = req.body.post_id;
			if (!postId) {
				res.json({ success: false, error: { message: 'missing post_id field in request body' } });
				return;
			}
			const canDelete = await userOwnsPost(req.user.id, postId);
			if (!canDelete) {
				res.json({
					success: false,
					error: {
						message: "you can't delete other people's posts",
					},
				});
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

	if (isNaN(postId)) {
		res.json({ success: false, error: { message: 'post id url parameter must be a number', postId } });
	}

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
