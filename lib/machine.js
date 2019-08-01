var ping = require('ping');
var si = require('systeminformation');

var args = require('./args.js');
var log = require('./logger.js').get();
var file = require('./file.js');

var last_read = null;
var cached_machines = [];

var localize = function(host) {
	return host.replace(/\d+\.\d+\.\d+\.\d+/, '0.0.0.0');
};

var readfile = function(filename, hostname) {
	return new Promise(function(resolve) {
		file.get(args.folder + filename, function(err, data) {
			log.debug('file:' + args.folder);
			log.debug('filename:' + filename);
			
			var obj = {'filename': filename};
			data = JSON.parse(data);
			obj[data.load] = data;
			if (obj[data.load].host && obj[data.load].host.startsWith(hostname)) {
				obj[data.load].host = localize(obj[data.load].host);
			}
			resolve(obj);
		});
	});
};

var get_all = function(IP) {
	return new Promise(function(resolve) {
		if (last_read && Date.now() < last_read + args.cache_interval) {
			return resolve(cached_machines);
		}
		
		return file.list(args.folder, function(err, files) {
			if (err) {
				log.error(err);
				return resolve({});
			}
			
			var promises = [];
			var hostname = IP.split(':')[0];
			for (var i = 0; i < files.length; ++i) {
				promises.push(readfile(files[i], hostname));
			}
			
			return Promise.all(promises).then(function(objects) {
				var ret = {};
				for (var i = 0; i < objects.length; ++i) {
					ret = Object.assign(ret, objects[i]);
				}
				
				last_read = Date.now();
				cached_machines = ret;
				return resolve(ret);
			});
		});
	});
};

var get_valid_host = function(ips, IP) {
	return new Promise(function(resolve) {
		if (!ips || !ips.length) {
			return resolve(localize(IP));
		}
		
		var ip = ips.pop();
		
		return ping.sys.probe(ip.host.replace(/(^https?:\/\/)|(:\d+$)/g, ''), function(is_alive){
			if (is_alive) {
				return resolve(ip.host);
			}
			file.del(args.folder + ip.filename, function(err) {
				if (err) {
					log.error('Probably someone else just removed it:' + err);
				}
			});
			
			return get_valid_host(ips, IP).then(resolve);
		});
	});
};


module.exports = {
	'all': get_all,
	'next': function (IP) {
		return new Promise(function(resolve) {
			return get_all(IP).then(function(ips) {
				return get_valid_host(Object.keys(ips).sort().reduce(function(m, k) {
					m[k] = ips[k];
					return m;
				}, {}), IP).then(resolve);
			});
		});
	},
	'cpu': function(IP) {
		return si.mem(function(mem_data) {
			return si.currentLoad(function(cpu_data) {
				// (used_cpu / total_cpu) * (used_mem / total_mem) = load
				var load = cpu_data.currentload / 100 * mem_data.used / mem_data.total;
				return file.set(args.folder + 'ds-' + IP.replace(/[^0-9]/g, '') + '.json', JSON.stringify({
					'host': IP,
					'load': load
				}), log.debug);
			});
		});
	}
};