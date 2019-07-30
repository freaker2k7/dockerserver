var args = require('./args.js');
var log = require('./logger.js').get();

var IP = null;
var machine = null;
var request = null;

var get_protocol = function() {
	return 'http' + (args.https && 's' || '') + '://';
};

var get_req = function(req, host) {
	return new Promise(function(resolve) {
		return request({
			method: req.method,
			url: host + req.originalUrl,
			headers: {
				'docker-server': 'force',
				'content-type': 'application/json',
				'authorization': req.get('Authorization')
			},
			body: req.method !== 'HEAD' && req.body && JSON.stringify(req.body) || undefined
		}, function (err, res, body) {
			log.debug('request:' + host + '::' + err + ' (' + (typeof body) + ') ' + JSON.stringify(body));
			if (err) {
				log.error('err:' + host + '::' + err);
				return resolve({'body': [err], 'host': host});
			}
			
			try {
				return resolve({'body': typeof body === 'string' && JSON.parse(body) || body, 'host': host});
			} catch(e) {
				if (body.startsWith('error')) {
					body = {'error': body};
				} else {
					log.error('request:' + host + '::' + err + ' (' + (typeof body) + ') ' + JSON.stringify(body));
				}
				
				return resolve({'body': [body], 'host': host});
			}
		});
	});
};

var handle_cluster_request = function(req, res, next) {
	return function(ip) {
		if (ip === IP) {
			next();
		} else {
			get_req(req, ip).then(function(ip_obj) {
				res.send(ip_obj.body || null);
			});
		}
	};
};

var handle_cluster = function(req, res, next) {
	if (req.method === 'PUT') {
		machine.next(IP).then(handle_cluster_request(req, res, next));
	} else if (~['GET', 'DELETE', 'HEAD', 'POST'].indexOf(req.method)) {
		machine.all(IP).then(function(ips) {
			var promises = [];
			for (var i in ips) {
				if (ips.hasOwnProperty(i)) {
					promises.push(get_req(req, ips[i].host));
				}
			}
			
			return Promise.all(promises).then(function(responses) {
				var response = [];
				for (var i = 0; i < responses.length; ++i) {
					// Add the host to each result for more clearance for the client.
					if (responses[i].body.length) {
						for (var j in responses[i].body) {
							if (responses[i].body.hasOwnProperty(j)) {
								responses[i].body.host = responses[i].host;
							}
						}
					} else {
						responses[i].body.host = responses[i].host;
					}
					response = response.concat(responses[i].body);
				}
				
				res.send(req.method !== 'HEAD' && response || undefined);
			});
		});
	} else {
		res.sendStatus(400);
	}
};


module.exports = {
	'get_protocol': get_protocol,
	'check': function(token) {
		return function (req, res, next) {
			if (req.get('Authorization') === token) {
				next();
			} else {
				res.sendStatus(401);
			}
		};
	},
	'protocol': function(app) {
		if (args.https) {
			const fs = require('fs');
			
			if (fs.existsSync('/certs/privkey.pem') && fs.existsSync('/certs/cert.pem')) {
				try {
					return require('https').createServer({
						key: fs.readFileSync('/certs/privkey.pem', 'utf8'),
						cert: fs.readFileSync('/certs/cert.pem', 'utf8'),
						ca: fs.existsSync('/certs/chain.pem') && fs.readFileSync('/certs/chain.pem', 'utf8') || undefined
					}, app);
				} catch (e) {
					log.error('Could not start secure server: ' + e);
					return require('http').createServer(app);
				}
			}
		}
		
		return require('http').createServer(app);
	},
	'balance': function(port) {
		if (args.cluster) {
			// This runs only once
			IP = get_protocol() + require('ip').address() + ':' + port;
			machine = require('./machine.js');
			request = require('request');
			
			machine.cpu(IP);
			setInterval(function() { machine.cpu(IP); }, args.refresh_rate);
		}
		
		return function (req, res, next) {
			// This runs every request
			if (args.cluster && req.get('docker-server') !== 'force') {
				handle_cluster(req, res, next);
			} else {
				next();
			}
		};
	}
};