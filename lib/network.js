var fs = require('fs');


module.exports = {
	'check': function(token) {
		return function (req, res, next) {
			if (req.get('Authorization') === token) {
				next();
			} else {
				res.sendStatus(401);
			}
		};
	},
	'protocol': function(app, is_https) {
		if (is_https && fs.existsSync('/certs/privkey.pem') && fs.existsSync('/certs/cert.pem')) {
			try {
				return require('https').createServer({
					key: fs.readFileSync('/certs/privkey.pem', 'utf8'),
					cert: fs.readFileSync('/certs/cert.pem', 'utf8'),
					ca: fs.existsSync('/certs/chain.pem') && fs.readFileSync('/certs/chain.pem', 'utf8') || undefined
				}, app);
			} catch (e) {
				console.error('Could not start secure server:', e);
				return require('http').createServer(app);
			}
		}
		
		return require('http').createServer(app);
	}
}