const fs = require('fs');
const ping = require('ping');
const si = require('systeminformation');

var args = null;

var localize = function(host) {
	return host.replace(/\d+\.\d+\.\d+\.\d+/, '0.0.0.0');
};

var readfile = function(file, hostname) {
	return new Promise(function(resolve, reject) {
		fs.readFile(args.folder + file, function(err, data) {
			var obj = {};
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
	return new Promise(function(resolve, reject) {
		return fs.readdir(args.folder, function(err, files) {
			if (err) {
				console.error(err);
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
				
				return resolve(ret);
			});
		});
	});
};

var get_valid_host = function(ips, IP) {
	return new Promise(function(resolve, reject) {
		if (!ips || !ips.length) {
			return resolve(localize(IP));
		}
		
		var ip = ips.pop();
		
		return ping.sys.probe(ip.host.replace(/(^https?:\/\/)|(:\d+$)/g, ''), function(is_alive){
			if (is_alive) {
				return resolve(ip.host);
			}
			try {
				fs.unlinkSync(args.folder + ip.host);
			} catch(e) {
				console.log('Probably someone else just removed it:', e);
			}
			
			return get_valid_host(ips, IP).then(resolve);
		});
	});
};


module.exports = function(cli_args) {
	args = cli_args;
	
	// Add a trailing slash to the folder path.
	args.folder = args.folder.replace(/\/+$/g, '') + '/';
	
	console.log(args.folder, fs.existsSync(args.folder));
	
	if (!fs.existsSync(args.folder)){
		fs.mkdirSync(args.folder, {recursive: true});
	}
	
	return {
		'all': get_all,
		'next': function (IP) {
			return new Promise(function(resolve, reject) {
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
					return fs.writeFileSync(args.folder + 'ds-' + IP.replace(/[^0-9]/g, '') + '.json', JSON.stringify({
						'host': IP,
						'load': load
					}));
				});
			});
		}
	};
};