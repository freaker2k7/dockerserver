#!/usr/bin/env node

var express = require('express');
var throttle = require('express-throttle');
var bodyParser = require('body-parser');
var uuid = require('uuid/v4');
var os = require('os');

var actions = require('./lib/actions.js');

var app = express();

var context = process.env.DS_CONTEXT || os.homedir();
var port = parseInt(process.env.DS_PORT) || 1717;
var token = process.env.DS_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxx';

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

app.get('/', throttle({ 'burst': 5, 'period': '1s' }), actions.ps);

app.get('/:id', throttle({ 'burst': 5, 'period': '1s' }), actions.logs);

app.put('/', throttle({ 'burst': 1, 'period': '1s' }), actions.run);

app.delete('/:id', throttle({ 'burst': 3, 'period': '1s' }), actions.rm);

app.listen(port);

console.log('Serving on http://localhost:' + port);


module.exports = Object.assign(actions, {'_app': app});