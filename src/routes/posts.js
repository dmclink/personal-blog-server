const express = require('express');
const router = express.Router();
const passport = require('../config/passport.js');

const {
	getAllPublishedPosts,
	addNewPost,
	upgradeUserPostPrivilege,
	getPostById,
	publishPost,
	editPost,
	deletePost,
	getUserDrafts,
} = require('../db/queries.js');

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

function checkMissingRequestBody(req, res, next) {
	if (!req.body) {
		res.json({ success: false, error: { message: 'missing request body' } });
		return;
	}

	next();
}

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

module.exports = router;
