const express = require('express');
const { prisma } = require('../prisma_lib/prisma.js');
const { hashPassword } = require('./lib/authutils.js');

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
