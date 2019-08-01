var args = require('./args.js');
var log = require('./logger.js').get();

var S3 = null;
var fs = null;
var redis = null;

if (args.redis) {
	var REDIS = require('redis');
	redis = REDIS.createClient(args.db_port, args.redis);
	redis.on('error', log.error);
} else if (args.s3) {
	var AWS = require('aws-sdk');
	S3 = new AWS.S3();
} else {
	fs = require('fs');
	
	if (!fs.existsSync(args.folder)){
		return fs.mkdirSync(args.folder, {recursive: true});
	}
}


module.exports = {
	'get': function(file, callback) {
		if (args.redis) {
			return redis.get(file, callback);
		} else if (args.s3) {
			return S3.getObject({Bucket: args.s3, Key: file}, function(err, data) {
				return callback(err, !err && Buffer.from(data.Body).toString('utf8'));
			});
		}
		return fs.readFile(file, callback);
	},
	'set': function(file, data, callback) {
		if (args.redis) {
			return redis.set(file, data, function(err) {
				return !err && redis.expire(file, args.expiry_seconds);
			});
		} else if (args.s3) {
			return S3.putObject({Bucket: args.s3, Key: file, Body: data}, function(err) {
				return callback(err);
			});
		}
		return fs.writeFile(file, data, callback);
	},
	'del': function(file, callback) {
		if (args.redis) {
			return redis.expire(file, -1, callback);
		} else if (args.s3) {
			return S3.deleteObject({Bucket: args.s3, Key: file}, function(err) {
				return callback(err);
			});
		}
		return fs.unlink(file, callback);
	},
	'list': function(dir, callback) {
		if (args.redis) {
			return redis.keys(dir + '*', function(err, data) {
				return callback(err, !err && data.map(function(v) { return v.replace(args.folder, ''); }));
			});
		} else if (args.s3) {
			return S3.listObjectsV2({Bucket: args.s3, Prefix: dir}, function(err, data) {
				return callback(err, !err && data.Contents.map(function(v) { return v.Key; }));
			});
		}
		return fs.readdir(dir, callback);
	}
};