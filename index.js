#!/usr/bin/env node

var express = require('express');
var throttle = require('express-throttle');
var bodyParser = require('body-parser');
var uuid = require('uuid/v4');
var os = require('os');

var docker = require('./lib/docker.js');

var app = express();

var context = process.env.DS_CONTEXT || os.homedir();
var port = parseInt(process.env.DS_PORT) || 1717;
var token = process.env.DS_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxx';

var low_burst = throttle({ 'burst': 1, 'period': '1s' });
var mid_burst = throttle({ 'burst': 3, 'period': '1s' });
var high_burst = throttle({ 'burst': 5, 'period': '1s' });

token = 'Basic ' + (Buffer.from && Buffer.from(token) || new Buffer(token)).toString('base64');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(function (req, res, next) {
	if (req.get('Authorization') === token) {
		next();
	} else {
		res.sendStatus(401);
	}
});

app.get('/', high_burst, docker.ps);

app.get('/:id', high_burst, docker.logs);

app.put('/', low_burst, docker.run);

app.post('/:id', low_burst, docker.exec);

app.delete('/:id', mid_burst, docker.rm);

app.listen(port);

console.log('Serving on http://localhost:' + port);


module.exports = Object.assign(docker, {'_app': app});