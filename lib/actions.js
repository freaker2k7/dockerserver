var dockerCLI = require('docker-cli-js');
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
			return res.status(400).send();
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
	'rm': function(req, res) {
		if (!req.params.id) {
			return res.status(400).send();
		}
		
		return docker.command('rm -f ' + req.params.id).then(function(data) {
			// console.debug('DELETE (RM):', data);
			res.json(data);
		}).catch(handle_error(req, res));
	}
};