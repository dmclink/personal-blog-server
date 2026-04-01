import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
const { Prisma } = require('@prisma/client');
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// for seeding admin user with post perms
const main = async () => {
	if (process.env.SEED_USERNAME && process.env.SEED_PASSWORD && process.env.SEED_EMAIL) {
		try {
			const pass = await hashPassword(process.env.SEED_PASSWORD);
			prisma.user.upsert({
				where: { email: process.env.SEED_EMAIL },
				update: {},
				create: {
					email: process.env.SEED_EMAIL,
					username: process.env.SEED_USERNAME,
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

main()
	.then(async () => {
		await prisma.$disconnect();
		await pool.end();
	})
	.catch(async (err) => {
		console.error(err);
		await prisma.$disconnect();
		await pool.end();
		process.exit(1);
	});
