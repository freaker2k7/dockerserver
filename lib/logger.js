const winston = require('winston');
require('winston-daily-rotate-file');

module.exports = function(args) {
	args.log_level = args.log_level.toLowerCase().replace(/trace/, 'silly');
	
	var transport = null;
	
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
}