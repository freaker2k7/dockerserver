var winston = require('winston');
require('winston-daily-rotate-file');

var args = require('./args.js');

module.exports = {
	'set': function() {
		var transport;
		
		if (~['debug', 'silly'].indexOf(args.log_level)) {
			transport = new winston.transports.Console({
				level: args.log_level
			});
		} else {
			transport = new (winston.transports.DailyRotateFile)({
				filename: '/tmp/docker-server-%DATE%.log',
				datePattern: 'YYYY-MM-DD-HH',
				zippedArchive: true,
				maxSize: args.log_max_size + 'm',
				maxFiles: args.log_expiry + 'd',
				level: args.log_level
			});
		}
		
		return winston.createLogger({
			name: 'ds-logger',
			transports: [transport]
		});
	},
	'get': function() {
		return winston.loggers.get('ds-logger');
	}
};