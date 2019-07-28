const yargs = require('yargs');
const express = require('express');
const throttle = require('express-rate-limit');

var args = yargs
	.option('port', {describe: 'DockerServer port.', type: 'number', default: parseInt(process.env.DS_PORT) || 1717})
	.option('token', {describe: 'Secret tocket (recommended between 1024-4096 chars).', type: 'string', default: process.env.DS_TOKEN || 'xxxxxx'})
	.option('low_burst', {describe: 'Max number of requests per minute for Low burst.', type: 'number', default: 60})
	.option('mid_burst', {describe: 'Max number of requests per minute for Mid burst.', type: 'number', default: 180})
	.option('high_burst', {describe: 'Max number of requests per minute for High burst.', type: 'number', default: 300})
	.option('https', {describe: 'Flag to turn on the HTTPS mode.', type: 'boolean', default: false})
	.option('cluster', {describe: 'Flag to turn on the Cluster mode.', type: 'boolean', default: false})
	.option('folder', {describe: 'Shared folder between all docker-servers.', type: 'string', default: '/tmp/docker-server'})
	.help('help', 'Show help.\nFor more documentation see https://github.com/freaker2k7/dockerserver')
	.argv;

const docker = require('./lib/docker.js');
const network = require('./lib/network.js')(args);

var app = express();

var low_burst = throttle({ 'max': args.low_burst, 'windowMs': 60000 });
var mid_burst = throttle({ 'max': args.mid_burst, 'windowMs': 60000 });
var high_burst = throttle({ 'max': args.high_burst, 'windowMs': 60000 });

// Encode the token only once!
var token = 'Basic ' + (Buffer.from && Buffer.from(args.token) || new Buffer(args.token)).toString('base64');
// Also, if you want to have a really long token,
// see https://nodejs.org/api/cli.html#cli_max_http_header_size_size

// The first middleware must be the token Auth.
app.use(network.check(token));

// Body parsers
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));

app.use(network.balance(args.port));

// Routes
app.get('/', high_burst, docker.ps);

app.get('/:id', high_burst, docker.logs);

app.put('/', low_burst, docker.run);

app.post('/:id', low_burst, docker.exec);

app.delete('/:id', mid_burst, docker.rm);

// Main listener
var server = network.protocol(app, args.https);
server.listen(args.port);
console.log('Serving on ' + network.get_protocol() + '0.0.0.0:' + args.port);


module.exports = Object.assign(docker, network, {'_app': app, '_server': server});