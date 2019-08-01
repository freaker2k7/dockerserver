// This file is dedicated for all the cli arguments.

var default_tmp_folder = '/tmp/docker-server';

var args = require('yargs')
	.option('port', {describe: 'DockerServer port.', type: 'number', default: parseInt(process.env.DS_PORT) || 1717})
	.option('token', {describe: 'Secret tocket (recommended between 1024-4096 chars).', type: 'string', default: process.env.DS_TOKEN || 'xxxxxx'})
	.option('low_burst', {describe: 'Max number of requests per minute for Low burst.', type: 'number', default: 60})
	.option('mid_burst', {describe: 'Max number of requests per minute for Mid burst.', type: 'number', default: 180})
	.option('high_burst', {describe: 'Max number of requests per minute for High burst.', type: 'number', default: 300})
	.option('https', {describe: 'Flag to turn on the HTTPS mode.', type: 'boolean', default: false})
	.option('cluster', {describe: 'Flag to turn on the Cluster mode.', type: 'boolean', default: false})
	.option('refresh_rate', {describe: 'Milliseconds between writes to the shared memory.', type: 'number', default: 30000})
	.option('cache_interval', {describe: 'Milliseconds to cache reads of all the machines.', type: 'number', default: 3000})
	.option('folder', {describe: 'Shared folder between all docker-servers.', type: 'string', default: default_tmp_folder})
	.option('redis', {describe: 'Shared redis server hostname.', type: 'string', default: null})
	.option('db_port', {describe: 'Shared server port number.', type: 'number', default: 6379})
	.option('s3', {describe: 'S3 bucket name, use with high refresh_rate.', type: 'string', default: null})
	.option('log_level', {describe: 'Log level [trace|debug|info|warn|error|fatal]', type: 'string', default: 'info'})
	.option('log_expiry', {describe: 'Time for a log to live in days.', type: 'number', default: 14})
	.option('log_max_size', {describe: 'Max log size in MB.', type: 'number', default: 25})
	.help('help', 'Show help.\nFor more documentation see https://github.com/freaker2k7/dockerserver')
	.argv;

if (args.redis) {
	if (args.folder === default_tmp_folder) {
		// See https://github.com/freaker2k7/dockerserver#parameters
		// If --redis is set, the `--folder` parameter becomes the key prefix (default: "DSC:")
		args.folder = 'DSC:';
	}
	args.expiry_seconds = parseInt(args.refresh_rate / 1000) * 2;
} else {
	// Add a trailing slash to the folder path.
	args.folder = args.folder.replace(/\/+$/g, '') + '/';
}

// Small fix for "winston"
args.log_level = args.log_level.toLowerCase().replace(/trace/, 'silly');


module.exports = args;