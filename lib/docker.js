const dockerCLI = require('docker-cli-js');
const uuid = require('uuid/v4');

var docker = new dockerCLI.Docker();

var handle_error = function(req, res) {
	return function(err) {
		res.status(500).send(err);
	};
};


module.exports = {
	'ps': function(req, res) {
		return docker.command('ps -a').then(function(data) {
			// console.debug('GET:', data);
			res.json(data.containerList || []);
		}).catch(handle_error(req, res));
	},
	'logs': function(req, res) {
		return docker.command('logs ' + req.params.id).then(function(data) {
			// console.debug('GET:', req.params.id, '::', data);
			res.json(data);
		}).catch(handle_error(req, res));
	},
	'run': function(req, res) {
		console.log(req.body);
		if (!req.body || !req.body.image) {
			return res.sendStatus(400);
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
				volumes += ' -v ' + k.replace(/^\.$/, context) + ':' + req.body.volumes[k];
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
			// console.debug('PUT:', data);
			res.json(data);
		}).catch(handle_error(req, res));
	},
	'exec': function(req, res) {
		console.log(req.body);
		
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
		
		console.log('>>> CMD:', 'exec' + tty + interactive + ' ' + req.params.id + ' ' + data);
		
		return docker.command('exec' + tty + interactive + ' ' + req.params.id + ' ' + data).then(function(data) {
			console.debug('POST:', req.params.id, '::', data);
			res.json(data);
		}).catch(handle_error(req, res));
	},
	'rm': function(req, res) {
		if (!req.params.id) {
			return res.sendStatus(400);
		}
		
		return docker.command('rm -f ' + req.params.id).then(function(data) {
			// console.debug('DELETE (RM):', req.params.id, '::', data);
			res.json(data);
		}).catch(handle_error(req, res));
	}
};