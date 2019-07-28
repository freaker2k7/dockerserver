const fs = require('fs');


if (fs.existsSync('Dockerfile')) {
	var package = fs.readFileSync('package.json');
	var package_lock = fs.readFileSync('package-lock.json');
	var data = fs.readFileSync('Dockerfile');
	
	
	package = JSON.parse(package);
	package_lock = JSON.parse(package_lock);
	data = data.toString().replace(/@\d+\.\d+\.\d+/, '@' + package.version);
	package_lock.version = package.version;
	
	fs.writeFileSync('Dockerfile', data);
	fs.writeFileSync('package-lock.json', JSON.stringify(package_lock, null, "\t") + "\n");
}