const express = require('express');
const { prisma } = require('../prisma_lib/prisma.js');
const { hashPassword } = require('./lib/authutils.js');

const { Prisma } = require('@prisma/client');

// id Int @id @default(autoincrement())
// email String @unique
// username String @unique
// hashed_password String
// can_post Boolean @default(false)
// admin Boolean @default(false)
// posts Post[]
// comments Comment[]
// email_verified Boolean @default(false)
// email_sent_at DateTime @default("1970-01-01T00:00:00Z")
// pfp_url String

// seed admin user
if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_EMAIL) {
	try {
		const pass = await hashPassword(process.env.ADMIN_PASSWORD);
		prisma.user.upsert({
			data: {
				email: process.env.ADMIN_EMAIL,
				username: process.env.ADMIN_USERNAME,
				hashed_password: pass,
				can_post: true,
				email_verified: true,
				admin: true,
			},
		});
	} catch (err) {
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
			console.log('admin already seeded');
		} else {
			console.error(err);
		}
	}
} else {
	console.log('skipping seed, missing env variable(s)');
}

const apiRouter = require('./routes/api.js');

const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.use('/api', apiRouter);

// catchall error route
app.use((req, res, next) => {
	const err = new Error('404 - resource not found!');
	err.status = 404;
	next(err);
});

app.use((error, req, res, next) => {
	console.error(error);
	res.status(error.status || 500);
	res.json({
		error: {
			message: error.message,
		},
	});
});

const PORT = process.env.PORT || 3000;
console.log('listening on port: ', PORT);
app.listen(PORT);
