#!/usr/bin/env node

const dockerCLI = require('docker-cli-js');
const express = require('express');
const throttle = require('express-throttle');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');

var app = express();
var docker = new dockerCLI.Docker();

const context = process.env.DS_CONTEXT || '/home/ubuntu';
const port = parseInt(process.env.DS_PORT) || 1717;
const token = process.env.DS_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxx';

var handle_error = function(req, res) {
	return function(err) {
		res.status(500).send(err);
	};
};

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(function (req, res, next) {
	if (Buffer.from((req.get('Authorization') || '').replace(/^Basic */, ''), 'base64').toString() === token) {
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

app.put('/', throttle({ 'burst': 1, 'period': '30s' }), function(req, res) {
	console.log(req.body);
	if (!req.body || !req.body.image) {
		return res.status(400)
	}
	
	let ports = '';
	let volumes = '';
	let data = '';
	let detach = '';
	let remove = '';
	
	if (req.body.ports) {
		for (let k in req.body.ports) {
			ports += ' -p ' + k + ':' + req.body.ports[k];
		}
	}
	if (req.body.volumes) {
		for (let k in req.body.volumes) {
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
		return res.status(400)
	}
	
	docker.command('rm -f ' + req.params.id).then(function(data) {
		// console.debug('DELETE (RM):', data);
		res.json(data);
	}).catch(handle_error(req, res));
});

app.listen(port);

console.log('Serving on http://localhost:' + port);


module.exports = app;