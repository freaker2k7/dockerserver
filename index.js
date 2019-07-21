#!/usr/bin/env node

var dockerCLI = require('docker-cli-js');
var express = require('express');
var throttle = require('express-throttle');
var bodyParser = require('body-parser');
var uuid = require('uuid/v4');
var os = require('os');

var app = express();
var docker = new dockerCLI.Docker();

var context = process.env.DS_CONTEXT || os.homedir();
var port = parseInt(process.env.DS_PORT) || 1717;
var token = process.env.DS_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxx';

token = (Buffer.from && Buffer.from(token) || new Buffer(token)).toString('base64');

var handle_error = function(req, res) {
	return function(err) {
		res.status(500).send(err);
	};
};

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(function (req, res, next) {
	if (req.get('Authorization') === token) {
		next();
	} else {
		res.status(401).send();
	}
});

app.get('/', throttle({ 'burst': 5, 'period': '1s' }), function(req, res) {
	docker.command('ps -a').then(function(data) {
		// console.debug('GET:', data);
		res.json(data.containerList || []);
	}).catch(handle_error(req, res));
});

app.get('/:id', throttle({ 'burst': 5, 'period': '1s' }), function(req, res) {
	docker.command('logs ' + req.params.id).then(function(data) {
		// console.debug('GET:', req.params.id, '::', data);
		res.json(data);
	}).catch(handle_error(req, res));
});

app.put('/', throttle({ 'burst': 1, 'period': '1s' }), function(req, res) {
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
	
	docker.command('run --name ' + (req.body.name || uuid()) + ports + volumes + remove + detach + ' ' + req.body.image + data).then(function(data) {
		// console.debug('PUT:', data);
		res.json(data);
	}).catch(handle_error(req, res));
});

app.delete('/:id', throttle({ 'burst': 3, 'period': '1s' }), function(req, res) {
	if (!req.params.id) {
		return res.status(400).send();
	}
	
	docker.command('rm -f ' + req.params.id).then(function(data) {
		// console.debug('DELETE (RM):', data);
		res.json(data);
	}).catch(handle_error(req, res));
});

app.listen(port);

console.log('Serving on http://localhost:' + port);


module.exports = app;