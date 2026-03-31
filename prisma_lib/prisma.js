import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = `${process.env.BLOG_DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// seed admin user
const seedAdmin = async () => {
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
};
seedAdmin();

export { prisma };
