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
		const post = await prisma.post.findUnique({ where: { id: postId } });
		return post;
	} catch (err) {
		throw err;
	}
}

async function editPost(postId, newTitle, newContent) {
	try {
		const post = await prisma.post.findUnique({ where: { id: postId } });

		if (!post) {
			throw new Error('post with that id not found');
		}

		const title = newTitle || post.title;
		const content = newContent || post.content;

		await prisma.post.update({ where: { id: postId }, data: { title, content } });
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
	publishPost,
	editPost,
	deletePost,
};
