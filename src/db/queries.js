const { prisma } = require('../../prisma_lib/prisma.js');

const { hashPassword } = require('../lib/authutils.js');

async function getUsers() {
	try {
		const users = await prisma.user.findMany();
		return users;
	} catch (err) {
		throw err;
	}
}

async function getUserById(id) {
	try {
		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) {
			const err = new Error('no user exists by id:', id);
			console.error(err);
			throw err;
		}
		return user;
	} catch (err) {
		throw err;
	}
}

async function usernameExists(username) {
	try {
		const user = await prisma.user.findFirst({ where: { username } });

		return user !== null;
	} catch (err) {
		throw err;
	}
}

async function getUserByUsername(username) {
	try {
		const user = await prisma.user.findFirst({ where: { username } });
		if (typeof user === 'undefined') {
			console.error(err);
			throw err;
		}

		return user;
	} catch (err) {
		throw err;
	}
}

async function emailExists(email) {
	try {
		const user = await prisma.user.findFirst({ where: { email } });

		return user !== null;
	} catch (err) {
		throw err;
	}
}

function randomDefaultPfpUrl() {
	const num = Math.round(Math.random() * 4);
	return `default_pfp${num}`;
}

async function addUser(email, username, password) {
	const hashedPassword = await hashPassword(password);
	const pfpUrl = randomDefaultPfpUrl();
	try {
		const user = await prisma.user.create({
			data: {
				email,
				username,
				hashed_password: hashedPassword,
				pfp_url: pfpUrl,
			},
		});

		return user;
	} catch (error) {
		throw err;
	}
}

async function userEmailVerified(id, email) {
	try {
		const user = await prisma.user.findUnique({ where: { id, email } });
		if (!user) {
			throw new Error('user not found with id and email:', id, email);
		}
		const updatedUser = await prisma.user.update({ where: { id, email }, data: { email_verified: true } });
		console.log('user email verification confirmed: ', updatedUser);
	} catch (err) {
		throw err;
	}
}

async function getAllPublishedPosts() {
	try {
		const posts = await prisma.post.findMany({
			where: { published_at: { not: null } },
			orderBy: {
				published_at: 'desc',
			},
			include: {
				comments: true,
			},
		});
		return posts;
	} catch (err) {
		throw err;
	}
}

async function addNewPost(postData) {
	try {
		const post = await prisma.post.create({
			data: {
				title: postData.title,
				description: postData.description,
				content: postData.content,
				published_at: postData.published_at,
				author: { connect: { id: postData.author_id } },
			},
		});

		return post;
	} catch (err) {
		throw err;
	}
}

async function upgradeUserPostPrivilege(userId) {
	try {
		const user = await prisma.user.update({ where: { id: userId }, data: { can_post: true } });
		return user;
	} catch (err) {
		throw err;
	}
}

async function publishPost(postId) {
	try {
		await prisma.post.update({ where: { id: postId }, data: { published_at: new Date() } });
	} catch (err) {
		throw err;
	}
}

async function getPostById(postId) {
	try {
		const post = await prisma.post.findUnique({
			where: { id: postId },
			include: { comments: true },
		});
		return post;
	} catch (err) {
		throw err;
	}
}

async function getPublishedPostById(postId) {
	try {
		const post = await prisma.post.findUnique({
			where: { id: postId, published_at: { not: null } },
			include: { comments: true },
		});
		return post;
	} catch (err) {
		throw err;
	}
}

async function editPost(postId, newTitle, newContent, newDescription) {
	try {
		const post = await prisma.post.findUnique({ where: { id: postId } });

		if (!post) {
			throw new Error('post with that id not found');
		}

		const title = newTitle || post.title;
		const content = newContent || post.content;
		const description = newDescription || post.description;

		await prisma.post.update({ where: { id: postId }, data: { title, content, description } });
	} catch (err) {
		throw err;
	}
}

async function deletePost(postId) {
	try {
		await prisma.post.delete({ where: { id: postId } });
	} catch (err) {
		throw err;
	}
}

async function getUserDrafts(userId) {
	try {
		const drafts = await prisma.post.findMany({ where: { authorId: userId, published_at: null } });
		return drafts;
	} catch (err) {
		throw err;
	}
}

async function getCommentsForPost(postId) {
	try {
		const comments = await prisma.comment.findMany({ where: { postId } });
		return comments;
	} catch (err) {
		throw err;
	}
}

async function addComment(authorId, postId, content) {
	try {
		const comment = await prisma.comment.create({
			data: {
				content,
				author: { connect: { id: authorId } },
				post: { connect: { id: postId } },
			},
		});
		console.log('new comment added:', comment);
	} catch (err) {
		throw err;
	}
}

async function isPublishedPost(postId) {
	try {
		const post = await prisma.post.findUnique({ where: { id: postId, published_at: { not: null } } });
		return post !== null;
	} catch (err) {
		throw err;
	}
}

module.exports = {
	getUsers,
	getUserById,
	getUserByUsername,
	usernameExists,
	emailExists,
	addUser,
	getUserByUsername,
	userEmailVerified,
	getAllPublishedPosts,
	addNewPost,
	upgradeUserPostPrivilege,
	getPostById,
	getPublishedPostById,
	publishPost,
	editPost,
	deletePost,
	getUserDrafts,
	getCommentsForPost,
	addComment,
	isPublishedPost,
};
