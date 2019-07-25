#!/usr/bin/env node

var express = require('express');
var throttle = require('express-rate-limit');

var docker = require('./lib/docker.js');
var network = require('./lib/network.js')

var args = require('yargs')
	.option('port', {describe: 'DockerServer port', type: 'number', default: parseInt(process.env.DS_PORT) || 1717})
	.option('token', {describe: 'Secret tocket (recommended between 1024-4096 chars)', type: 'string', default: process.env.DS_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxx'})
	.option('low_burst', {describe: 'Max number of requests per minute for Low burst', type: 'number', default: 60})
	.option('mid_burst', {describe: 'Max number of requests per minute for Mid burst', type: 'number', default: 180})
	.option('high_burst', {describe: 'Max number of requests per minute for High burst', type: 'number', default: 300})
	.option('https', {describe: 'Flag to turn on the HTTPS mode [See docs., https://github.com/freaker2k7/dockerserver]', type: 'boolean', default: false})
	.help('info')
	.argv;

var app = express();

var low_burst = throttle({ 'max': args.low_burst, 'windowMs': 60000 });
var mid_burst = throttle({ 'max': args.mid_burst, 'windowMs': 60000 });
var high_burst = throttle({ 'max': args.high_burst, 'windowMs': 60000 });

// Encode the token only once!
var token = 'Basic ' + (Buffer.from && Buffer.from(args.token) || new Buffer(args.token)).toString('base64');

// The first middleware must be the token Auth.
app.use(network.check(token));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get('/', high_burst, docker.ps);

app.get('/:id', high_burst, docker.logs);

app.put('/', low_burst, docker.run);

app.post('/:id', low_burst, docker.exec);

app.delete('/:id', mid_burst, docker.rm);

// Main listener
network.protocol(app, args.https).listen(args.port);
console.log('Serving on http' + (args.https && 's' || '') + '://0.0.0.0:' + args.port);


module.exports = Object.assign(docker, network, {'_app': app});