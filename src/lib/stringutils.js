function randomDefaultPfpUrl() {
	const num = Math.round(Math.random() * 4);
	return `default_pfp${num}`;
}

module.exports = { randomDefaultPfpUrl };
