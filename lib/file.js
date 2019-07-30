var args = require('./args.js');

var S3 = null;
var fs = null;

if (args.s3) {
	var AWS = require('aws-sdk');
	S3 = new AWS.S3();
} else {
	fs = require('fs');
	
	// Otherwise, it'll created automatically
	if (!fs.existsSync(args.folder)){
		return fs.mkdirSync(args.folder, {recursive: true});
	}
}


module.exports = {
	'readFile': function(file, callback) {
		if (args.s3) {
			return S3.getObject({Bucket: args.s3, Key: args.folder + file}, function(err, data) {
				return callback(err, !err && Buffer.from(data.Body).toString('utf8'));
			});
		}
		return fs.readFile(file, callback);
	},
	'writeFile': function(file, data, callback) {
		if (args.s3) {
			return S3.putObject({Bucket: args.s3, Key: args.folder + file, Body: data}, function(err, data) {
				return callback(err);
			});
		}
		return fs.writeFile(file, data, callback);
	},
	'unlink': function(file, callback) {
		if (args.s3) {
			return S3.deleteObject({Bucket: args.s3, Key: args.folder + file}, function(err, data) {
				return callback(err);
			});
		}
		return fs.unlink(file, callback);
	},
	'readdir': function(dir, callback) {
		if (args.s3) {
			return S3.listObjectsV2({Bucket: args.s3, Prefix: args.folder + file}, function(err, data) {
				return callback(err, !err && data.Contents.map(function(v) { return v.Key; }));
			});
		}
		return fs.readdir(dir, callback);
	}
};