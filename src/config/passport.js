const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const passport = require('passport');

const opts = {};

const strategy = new JwtStrategy(opts);

passport.use(strategy);

module.exports = passport;
