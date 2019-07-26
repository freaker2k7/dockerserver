var request = null;
var IP = null;
var db = {
	'initialized': false,
	'get': function(id) {},
	'set': function(id, IP) {},
	'del': function(id) {}
};

var get_protocol = function(is_https) {
	return 'http' + (is_https && 's' || '') + '://';
};

var get_req = function(req, host) {
	return new Promise(function(resolve, reject) {
		return request({
			url: host + req.originalUrl,
			headers: Object.assign(req.headers, {'docker-server': 'force', 'content-type': 'application/json'}),
			form: req.body,
			method: req.method
		}, function (err, res, body) {
			console.log('request:', host, err, typeof body, body);
			
			if (err) {
				console.error('err:', host, err);
				return resolve({'body': [err], 'host': host});
			}
			
			try {
				return resolve({'body': typeof body === 'string' && JSON.parse(body) || body, 'host': host});
			} catch(e) {
				
				console.log('??????????????? body', host, typeof body, body);
				
				if (body.startsWith('error')) {
					body = {'error': body};
				}
				
				return resolve({'body': [body], 'host': host});
			}
		});
	});
}

var handle_cluster_request = function(req, res, next, is_https) {
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
	'protocol': function(app, is_https) {
		if (is_https) {
			const fs = require('fs');
			
			if (fs.existsSync('/certs/privkey.pem') && fs.existsSync('/certs/cert.pem')) {
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
		}
		
		return require('http').createServer(app);
	},
	'balance': function(is_cluster, is_https, port) {
		if (is_cluster) {
			request = require('request');
			IP = get_protocol(is_https) + require('ip').address() + ':' + port;
			db = require('./db.js');
			
			db.cpu(IP);
			setInterval(function() { db.cpu(IP); }, 30000);
		}
		
		return function (req, res, next) {
			console.log('000 ??? body', JSON.stringify(req.body));
			
			if (is_cluster && req.get('docker-server') !== 'force') {
				if (req.method === 'PUT') {
					db.next(IP).then(handle_cluster_request(req, res, next, is_https));
				} else if(~['GET', 'DELETE', 'POST'].indexOf(req.method)) {
					db.all(IP).then(function(ips) {
						var promises = [];
						for (var i in ips) {
							promises.push(get_req(req, ips[i].host));
						}
						
						Promise.all(promises).then(function(responses) {
							var response = [];
							for (var i = 0; i < responses.length; ++i) {
								for (var j in responses[i].body) {
									responses[i].body[j].host = responses[i].host;
								}
								response = response.concat(responses[i].body)
							}
							res.send(response);
						});
					});
				} else {
					res.sendStatus(400);
				}
			} else {
				next();
			}
		};
	}
}