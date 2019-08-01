const fs = require('fs');


if (fs.existsSync('Dockerfile')) {
	var package = fs.readFileSync('package.json');
	var data = fs.readFileSync('Dockerfile');
	
	
	package = JSON.parse(package);
	data = data.toString().replace(/@\d+\.\d+\.\d+/, '@' + package.version);
	
	fs.writeFileSync('Dockerfile', data);
}