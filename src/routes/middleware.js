const { userEmailVerified } = require('../db/queries.js');
async function canComment(req, res, next) {
	try {
		const verified = req.user.email_verified;
		if (!verified) {
			res.json({
				success: false,
				error: { message: 'You must verify your email before you can comment on blog posts' },
			});
			return;
		}
	} catch (err) {
		throw err;
	}

	next();
}

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

module.exports = { canComment, canPost, checkMissingRequestBody };
