const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const passport = require('passport');
const { prisma } = require('../../lib/prisma.js');

const opts = {
	secretOrKey: process.env.PERSONAL_BLOG_JWT_SECRET_KEY,
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	issuer: 'https://www.github.com/dmclink/personal-blog-server',
	audience: 'personal-blog-user',
	jsonWebTokenOptions: {},
};

const verifyCallback = (jwt_payload, done) => {
	//FIXME: delete this
	console.log(jwt_payload);
	try {
		const users = prisma.user.findMany();
		console.log(users);
	} catch (err) {
		console.error(err);
	}
	console.log('called the verify callback');
	return done(err, false);
	//TODO: implement verify callback by querying prisma for the user id
};

const strategy = new JwtStrategy(opts, verifyCallback);

passport.use(strategy);

module.exports = passport;
