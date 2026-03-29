const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../prisma_lib/prisma.js');
const { logger } = require('../config/nodemailer.js');

const SALT_ROUNDS = 10;

async function hashPassword(password) {
	try {
		const hash = await bcrypt.hash(password, SALT_ROUNDS);

		return hash;
	} catch (err) {
		console.error(err);
		throw err;
	}
}

async function passwordMatches(password, storedHash) {
	try {
		const result = await bcrypt.compare(password, storedHash);
		return result;
	} catch (err) {
		console.error(err);
		throw err;
	}
}

async function verifyPassword(userId, password) {
	try {
		if (!userId) {
			throw new Error('cannot pass an empty user id to this funtion, user:', userId);
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			const err = new Error('user does not exist with id:', userId);
			throw err;
		}

		const hashedPassword = user.hashed_password;
		const result = await passwordMatches(password, hashedPassword);

		return result;
	} catch (err) {
		console.error(err);
		throw err;
	}
}

function buildUserAuthToken(user) {
	const payload = {
		sub: user.id,
		email_verified: user.email_verified,
		email_sent_at: !user.email_verified ? user.email_sent_at : undefined,
		can_post: user.can_post,
		admin: user.admin,
		iss: 'https://www.github.com/dmclink/personal-blog-server',
		aud: 'personal-blog-user',
	};

	const token = jwt.sign(payload, process.env.PERSONAL_BLOG_JWT_SECRET_KEY, {
		expiresIn: '24h',
	});

	return token;
}

module.exports = { hashPassword, passwordMatches, verifyPassword, buildUserAuthToken };
