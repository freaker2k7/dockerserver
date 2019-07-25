# DockerServer
Super lightweight & simple REST server for running [docker](https://docker.com/ "docker") containers on a remote machine.

[![npm version](https://badge.fury.io/js/docker-server.svg)](https://badge.fury.io/js/docker-server)
[![npm downloads](https://img.shields.io/npm/dm/docker-server.svg)](https://www.npmjs.com/package/docker-server)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/freaker2k7/dockerserver.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/freaker2k7/dockerserver/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/freaker2k7/dockerserver.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/freaker2k7/dockerserver/context:javascript)
<br>

<a href="https://dockerserver.io/" title="DockerServer Logo" target="_blank">
	<img src="https://i.imgur.com/14Cypln.png" alt="DockerServer Logo" title="DockerServer Logo" style="box-shadow: none;">
</a>

## Install
`npm i -g docker-server`<br>
or<br>
`docker run -d -p 1717:1717 --restart=always --name=docker-server -v /var/run/docker.sock:/var/run/docker.sock -e "DS_TOKEN=my_secret_token" evgy/dockerserver`

## Background
I needed to run a couple of containers on a remote machine and came to these conclusions:
* Kubernetes is an overkill !
* docker-machine is also complicated !
* I just want to run a few containers...

## Approach
Built a small REST server with NodeJS, using the `express` and `docker-cli-js` packages as a base.

### Design Principles
* Docker is (a) present.
* Keep the business logic simple!
* It must be stateless!

### Current architecture
<img alt="How things work today" src="https://i.imgur.com/S45VhXe.png" />

## Usage
Install DockerServer on the machine that you want to run your containers.

DockerServer can be run for a single session with:<br>
`$ docker-server`<br>
or as a service using [PM2](https://pm2.keymetrics.io/ "PM2"):<br>
`$ pm2 start /usr/lib/node_modules/docker-server/pm2.config.js`<br>
and if you want in addition to start it on startup just run:<br>
`$ pm2 startup`<br>
And of-course, as mentioned before, but using params, via docker itself:<br>
`$ docker run -d -p 1717:1717 --restart=always --name=docker-server -v /var/run/docker.sock:/var/run/docker.sock evgy/dockerserver docker-server --token my_secret_token`<br>
Or you can run in HTTPS mode:<br>
(Note that in this example I'm using [Let's Encrypt](https://letsencrypt.org/ "Let's Encrypt") and I'm using `readlink` because these files are symbolic links)<br>
`$ docker run -d -p 1717:1717 --restart=always --name=docker-server -v /var/run/docker.sock:/var/run/docker.sock 
-v $(readlink -f /home/user/letsencrypt/config/live/your-domain.com/cert.pem):/certs/cert.pem:ro 
-v $(readlink -f /home/user/letsencrypt/config/live/your-domain.com/chain.pem):/certs/chain.pem:ro 
-v $(readlink -f /home/user/letsencrypt/config/live/your-domain.com/privkey.pem):/certs/privkey.pem:ro 
evgy/dockerserver docker-server --token my_secret_token --https`

Now, you can do "remote" docker operation using simple HTTP requests:

1. GET / - List all the containers (docker ps -a)
2. GET /:id - Show the logs of a specific container (docker logs :id)
3. PUT / - Run a container (docker run...)
4. POST /:id - Execute a command in a container (docker exec...)
5. DELETE /:id - Delete a container with such a name or an ID (docker rm -f :id)

### Options
#### Environment
You can set the following environment variables to configure DockerServer:

1. `DS_PORT` - The port on which the DockerServer is running (default: 1717)
2. `DS_TOKEN` - The secret token for the authorization (default: xxxxxxxxxxxxxxxxxxxxxxxx)

#### Parameters
Also, you can start DockerServerwith these parameters:

1. `--port [num]` - Same as `DS_PORT`
2. `--token [string]` - Same as `DS_TOKEN`
3. `--low_burst [num]` - Max number of requests per minute for Low burst
4. `--mid_burst [num]` - Max number of requests per minute for Mid burst
5. `--high_burst [num]` - Max number of requests per minute for High burst
6. `--info` - Show help.
7. `--https` - Enable HTTPS mode. For this you must have the following files:
	a. /certs/cert.pem
	b. /certs/privkey.pem
	c. /certs/chain.pem (optional, to support self-signed certs)


#### POST/PUT Data
When sending the PUT request, the following parameters are supported:

1. image - The image for the run (**required**) (default: null)
2. name - The name of the container (default: uuid4())
3. remove - Flag to remove the container when it finishes `--rm` (default: false).
4. detach - Flag to detach the container `-d` (default: false).
5. ports - **Map** of ports to publish (default: null)
6. volumes - **Map** of volumes to mount (default: null)
7. data - CMD to run inside the container (default: null)

### Examples
NOTE: In the examples I assumed you're using the default port.

1. Get a list of all the containers:<br>
`$ curl -X GET http://1.2.3.4:1717/ -H 'Authorization: Basic base64EncodedToken'`

2. Run redis on the remote machine:<br>
`$ curl -X PUT http://1.2.3.4:1717/ -H 'Authorization: Basic base64EncodedToken' --data 'name=p-redis&image=redis&ports[1234]=6379'`<br>
and/or<br>
`$ curl -X PUT http://1.2.3.4:1717/ -H 'Authorization: Basic base64EncodedToken' --data 'name=v-redis&image=redis&volumes[/tmp/data]=/data'`

3. Remove our created container(s):<br>
`$ curl -X DELETE http://1.2.3.4:1717/p-redis -H 'Authorization: Basic base64EncodedToken'`<br>
and/or<br>
`$ curl -X DELETE http://1.2.3.4:1717/v-redis -H 'Authorization: Basic base64EncodedToken'`


## Changelog

1.5.1 - Added test for [AppVeyor](https://appveyor.com/ "AppVeyor").

1.5.0 - Stable HTTPS support.

1.4.4 - Fixed some typos.

1.4.2 - Added HTTPS support & parametrized all env. variables.

1.4.1 - Removed unused DS_CONTEXT env. variable & received JS code quality A+ score on [LGTM](https://lgtm.com "LGTM").

1.2.9 - Fixed some typos.

1.2.7 - Replaced express-throttle with express-rate-limit.

1.2.5 - Stable, simple express server with express-throttle.

1.0 - Release, woohoo!!

## Roadmap
* Queue (for heavy loads)
* Design cluster mode + Load balancing

## License
APACHE-2.0 (see the LICENSE files in the repository).