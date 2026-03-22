const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const passport = require('passport');
const { prisma } = require('../../prisma_lib/prisma.js');

const opts = {
	secretOrKey: process.env.PERSONAL_BLOG_JWT_SECRET_KEY,
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	issuer: 'https://www.github.com/dmclink/personal-blog-server',
	audience: 'personal-blog-user',
	jsonWebTokenOptions: {},
};

const verifyCallback = async (jwt_payload, done) => {
	try {
		const user = await prisma.user.findUnique({ where: { id: jwt_payload.sub } });
		if (!user) {
			return done(null, false);
		}
		return done(null, user);
	} catch (err) {
		console.error(err);
		return done(err, false);
	}
};

const strategy = new JwtStrategy(opts, verifyCallback);

passport.use(strategy);

module.exports = passport;
