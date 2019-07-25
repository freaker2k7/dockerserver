module.exports = {
	"apps": [{
		"id": "docker-server-" + ((Math.random() * 100000) % 1000),
		"name": "docker-server",
		"script": "node index.js",
		"args": ["--trace-warnings"],
		"cwd": "/usr/lib/node_modules/docker-server",
		"watch": true,
		"error_file": "~/.pm2/logs/docker-server-error.log",
		"log_file": "~/.pm2/logs/docker-server.log",
		"instances": 1,
		"exec_mode": "fork",
		"env": {
			"NODE_ENV": "production"
		}
	}]
};