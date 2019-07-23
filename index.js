#!/usr/bin/env node

var express = require('express');
var throttle = require('express-rate-limit');
var os = require('os');

var docker = require('./lib/docker.js');

var app = express();

var low_burst = throttle({ 'max': 60, 'windowMs': 60000 });
var mid_burst = throttle({ 'max': 180, 'windowMs': 60000 });
var high_burst = throttle({ 'max': 300, 'windowMs': 60000 });

var context = process.env.DS_CONTEXT || os.homedir();
var port = parseInt(process.env.DS_PORT) || 1717;
var token = process.env.DS_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxx';


token = 'Basic ' + (Buffer.from && Buffer.from(token) || new Buffer(token)).toString('base64');

app.use(function (req, res, next) {
	if (req.get('Authorization') === token) {
		next();
	} else {
		res.sendStatus(401);
	}
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', high_burst, docker.ps);

app.get('/:id', high_burst, docker.logs);

app.put('/', low_burst, docker.run);

app.post('/:id', low_burst, docker.exec);

app.delete('/:id', mid_burst, docker.rm);

app.listen(port);

console.log('Serving on http://localhost:' + port);


module.exports = Object.assign(docker, {'_app': app});