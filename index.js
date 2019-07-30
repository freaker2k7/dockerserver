var express = require('express');
var throttle = require('express-rate-limit');

var args = require('./lib/args.js');
var log = require('./lib/logger.js').set();
var docker = require('./lib/docker.js');
var network = require('./lib/network.js');

var app = express();

var low_burst = throttle({ 'max': args.low_burst, 'windowMs': 60000 });
var mid_burst = throttle({ 'max': args.mid_burst, 'windowMs': 60000 });
var high_burst = throttle({ 'max': args.high_burst, 'windowMs': 60000 });

// Encode the token only once!
var token = 'Basic ' + Buffer.from(args.token).toString('base64');
// Also, if you want to have a really long token,
// see https://nodejs.org/api/cli.html#cli_max_http_header_size_size

// The first middleware must be the token Auth.
app.use(network.check(token));

// Body parsers
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));

app.use(network.balance(args.port));

// Routes
app.head('/:id*', low_burst, docker.pull);

app.get('/', high_burst, docker.ps);

app.get('/:id', high_burst, docker.logs);

app.put('/', low_burst, docker.run);

app.post('/:id', low_burst, docker.exec);

app.delete('/:id', mid_burst, docker.rm);

// Main listener
var server = network.protocol(app, args.https);
server.listen(args.port);
log.info('Serving on ' + network.get_protocol() + '0.0.0.0:' + args.port);


module.exports = Object.assign(docker, network, {'_app': app, '_server': server});