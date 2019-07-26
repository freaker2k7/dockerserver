const ping = require('ping');
const redis = require('redis');
const si = require('systeminformation');

var args = require('yargs')
	.option('db-host', {describe: '(Redis) Database host address.', type: 'string', default: 'localhost'})
	.option('db-port', {describe: '(Redis) Database port.', type: 'number', default: 6379})
	.argv;

var client = redis.createClient(args['db-port'], args['db-host']);

var get_all = function(IP) {
	return new Promise(function(resolve, reject) {
		return client.keys('DSC:*', function(err, hosts) {
			var promises = [];
			var hostname = IP.split(':')[0];
			for (var i in hosts) {
				promises.push(function(host) {
					return new Promise(function(in_resolve, in_reject) {
						client.get('DSC:' + host, function(err, load) {
							if (host.startsWith(hostname)) {
								host = host.replace(/\d+\.\d+\.\d+\.\d+/, '0.0.0.0');
							}
							
							return in_resolve({'host': host, 'load': load});
						});
					});
				}(hosts[i].replace(/^DSC:/, '')));
			}
			
			return Promise.all(promises).then(resolve);
		});
	});
};

var get_valid_host = function(ips, IP) {
	return new Promise(function(resolve, reject) {
		if (!ips || !ips.length) {
			return resolve(IP);
		}
		
		var ip = ips.pop();
		
		return ping.sys.probe(ip.host.replace(/(^https?:\/\/)|(:\d+$)/g, ''), function(is_alive){
			if (is_alive) {
				return resolve(ip.host);
			}
			
			return get_valid_host(ips, IP).then(resolve);
		});
	});
};

client.on("error", function (err) {
	console.error("Error " + err);
});

module.exports = {
	'all': get_all,
	'next': function (IP) {
		return new Promise(function(resolve, reject) {
			return get_all(IP).then(function(ips) {
				ips.sort(function(a, b) {
					if (a.load > b.load) {
						return 1;
					} else if (a.load < b.load) {
						return -1;
					}
					return 0;
				});
				
				return get_valid_host(ips, IP).then(resolve);
			});
		});
	},
	'cpu': function(IP) {
		return si.mem(function(mem_data) {
			return si.currentLoad(function(cpu_data) {
				// (used_cpu / total_cpu) * (used_mem / total_mem) = load
				return client.setex('DSC:' + IP, 60, cpu_data.currentload / 100 * mem_data.used / mem_data.total);
			});
		});
	}
};