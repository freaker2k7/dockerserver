var dockerCLI = require('docker-cli-js');
var uuid = require('uuid/v4');

var log = require('./logger.js').get();

var docker = new dockerCLI.Docker();

var handle_error = function(req, res) {
	return function(err) {
		res.status(500).json({
			"code": 500,
			"error": err
		});
	};
};

var check_id = function(req, res) {
	if (!req.params || !req.params.id) {
		res.status(400).json({
			"code": 400,
			"error": 'No id or name supplied!'
		});
	}
};


module.exports = {
	'pull': function(req, res) {
		log.debug('HEAD:' + req.params.id);
		check_id(req, res);
		
		return docker.command('pull ' + req.params.id).then(function(data) {
			log.debug('HEAD:' + req.params.id + '::' + JSON.stringify(data));
			res.status(data.error && 400 || 200).end();
			// HEAD requests don't have a response body: https://tools.ietf.org/html/rfc7231
		}).catch(handle_error(req, res));
	},
	'ps': function(req, res) {
		return docker.command('ps -a').then(function(data) {
			log.debug('GET:' + JSON.stringify(data));
			res.json(data.containerList || []);
		}).catch(handle_error(req, res));
	},
	'logs': function(req, res) {
		check_id(req, res);
		
		return docker.command('logs ' + req.params.id).then(function(data) {
			log.debug('GET:' + req.params.id + '::' + JSON.stringify(data));
			res.json(data);
		}).catch(handle_error(req, res));
	},
	'run': function(req, res) {
		log.debug('PUT Request: ' + JSON.stringify(req.body));
		if (!req.body || !req.body.image) {
			return res.status(400).json({
				"code": 400,
				"error": 'No image supplied!'
			});
		}
		
		var ports = '';
		var volumes = '';
		var data = '';
		var detach = '';
		var remove = '';
		
		if (req.body.ports) {
			for (var k in req.body.ports) {
				ports += ' -p ' + k + ':' + req.body.ports[k];
			}
		}
		if (req.body.volumes) {
			for (var k in req.body.volumes) {
				volumes += ' -v ' + k + ':' + req.body.volumes[k];
			}
		}
		if (req.body.detach) {
			detach = ' --detach';
		}
		if (req.body.remove) {
			remove = ' --rm';
		}
		if (req.body.data) {
			data = ' ' + req.body.data;
		}
		
		return docker.command('run --name ' + (req.body.name || uuid()) + ports + volumes + remove + detach + ' ' + req.body.image + data).then(function(data) {
			log.debug('PUT:' + data);
			res.json(data);
		}).catch(handle_error(req, res));
	},
	'exec': function(req, res) {
		log.debug('POST Request:' + JSON.stringify(req.body));
		check_id(req, res);
		
		var data = '';
		var interactive = '';
		var tty = '';
		
		if (req.body.interactive) {
			interactive = ' -i';
		}
		if (req.body.tty) {
			tty = ' -t';
		}
		if (req.body.data) {
			data = ' ' + req.body.data;
		}
		
		return docker.command('exec' + tty + interactive + ' ' + req.params.id + ' ' + data).then(function(data) {
			log.debug('POST:' + req.params.id + '::' + JSON.stringify(data));
			res.json(data);
		}).catch(handle_error(req, res));
	},
	'rm': function(req, res) {
		log.debug('DELETE Request: ' + JSON.stringify(req.body));
		check_id(req, res);
		
		return docker.command('rm -f ' + req.params.id).then(function(data) {
			log.debug('DELETE (RM):' + req.params.id + '::' + JSON.stringify(data));
			res.json(data);
		}).catch(handle_error(req, res));
	}
};