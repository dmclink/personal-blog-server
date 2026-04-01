const express = require('express');
const { prisma } = require('../prisma_lib/prisma.js');
const { hashPassword } = require('./lib/authutils.js');
const cors = require('cors');

const apiRouter = require('./routes/api.js');

const app = express();

app.use(express.json());
app.use(express.urlencoded());

const allowedOrigins = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map((o) => o.trim()) : [];
app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	}),
);

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

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
console.log('listening on port: ', port);
console.log('open to origins:', allowedOrigins);
app.listen(port, host);
