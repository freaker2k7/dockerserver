<style type="text/css">table {table-layout: fixed;width: 100%;}</style>

# DockerServer
Super lightweight & simple RESTFul stateless server for running [docker](https://docker.com/ "docker") containers on a remote machine(s) in a secure way.

[![npm version](https://badge.fury.io/js/docker-server.svg)](https://badge.fury.io/js/docker-server)
[![npm downloads](https://img.shields.io/npm/dm/docker-server.svg)](https://www.npmjs.com/package/docker-server)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/freaker2k7/dockerserver.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/freaker2k7/dockerserver/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/freaker2k7/dockerserver.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/freaker2k7/dockerserver/context:javascript)
[![Build status](https://ci.appveyor.com/api/projects/status/rwbo4jvqp4032boj/branch/master?svg=true)](https://ci.appveyor.com/project/freaker2k7/dockerserver/branch/master)
[![Gitter](https://badges.gitter.im/freaker2k7-dockerserver/community.svg)](https://gitter.im/freaker2k7-dockerserver/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![License](https://img.shields.io/badge/license-Apache-brightgreen.svg)](https://opensource.org/licenses/Apache-2.0)


<center>
	<a href="https://dockerserver.io/" title="DockerServer Logo" target="_blank">
		<img src="https://i.imgur.com/14Cypln.png" alt="DockerServer Logo" title="DockerServer Logo" style="box-shadow: none;" style="max-width: 100%; border: 0;">
	</a>
</center>

## Install
`npm i -g docker-server`

Or

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
<center>
	<img src="https://i.imgur.com/7cS4vWj.png" alt="How things work today" style="max-width: 100%; border: 0;" /><br>
	<sub style="font-style: italic;">The cluster diagram demonstrates a PUT request.</sub>
</center>


#### Notes for the Cluster Mode:

  *\*0 - Connection between the load balancer and the docker-server.*

  *\*1 - Save the machine load to a [JSON](https://json.org "JSON") file in a shared folder (among all the machines).*


  **PUT method**

  *1 - Requests comes to any free (according to the load balancer) node to answer.*

  *2 - Get the most free (according to actual cpu-mem ratio) node (from the shared storage).*

  *3 - Resend the current request to that node (or process if it's the current node) and return the answer.*


  **For the rest of the methods**
  
  *Resent the current request to all the nodes and return the merged results.*

## Usage
Install DockerServer on the machine that you want to run your containers.

DockerServer can be run for a single session with:

`$ docker-server`

or as a service using [PM2](https://pm2.keymetrics.io/ "PM2"):

`$ pm2 start /usr/lib/node_modules/docker-server/pm2.config.js`

and if you want in addition to start it on startup just run:

`$ pm2 startup`

And of-course, as mentioned before, but using params, via docker itself:

`$ docker run -d -p 1717:1717 --restart=always --name=docker-server -v /var/run/docker.sock:/var/run/docker.sock evgy/dockerserver docker-server --token my_secret_token`

Or you can run in **HTTPS** mode:

(Note that in this example I'm using [Let's Encrypt](https://letsencrypt.org/ "Let's Encrypt") and I'm using `readlink` because these files are symbolic links)

`$ docker run -d -p 443:1717 --privileged --restart=always --name=docker-server -v /var/run/docker.sock:/var/run/docker.sock 
-v $(readlink -f /home/user/letsencrypt/config/live/your-domain.com/cert.pem):/certs/cert.pem:ro 
-v $(readlink -f /home/user/letsencrypt/config/live/your-domain.com/chain.pem):/certs/chain.pem:ro 
-v $(readlink -f /home/user/letsencrypt/config/live/your-domain.com/privkey.pem):/certs/privkey.pem:ro 
evgy/dockerserver docker-server --token my_secret_token --https`

<sub>Note: The **--privileged** argument is only needed in order to use the 443 port, because all ports below 1024 are reserved by root.</sub>

Moreover, you can run in a **Cluster mode** when you have a couple of machines to use:

`$ docker run -d -p 1717:1717 --privileged --restart=always --name=docker-server -v /var/run/docker.sock:/var/run/docker.sock 
-v /some/shared/folder:/my/somewhy/custom/path evgy/dockerserver docker-server --token my_secret_token --cluster --folder /my/somewhy/custom/path`

Or simply:

`$ docker run -d -p 1717:1717 --privileged --restart=always --name=docker-server -v /var/run/docker.sock:/var/run/docker.sock 
-v /some/shared/folder:/tmp/docker-server evgy/dockerserver docker-server --token my_secret_token --cluster`

Note: `/tmp/docker-server` is the default folder so you can easily and safely run it even without docker.

Now, you can do "remote" docker operation using simple HTTP requests:

| HTTP Method | Endpoint | Desc. | Docker cmd |
|---|---|---|---|
| GET | / | List all the containers | docker ps -a |
| GET | /:id | Show the logs of a specific container | docker logs :id |
| PUT | / | Run a container | docker run... |
| POST | /:id | Execute a command in a container | docker exec... |
| DELETE | /:id | Delete a container with such a name or an ID | docker rm -f :id |

### Options
#### Environment
You can set the following environment variables to configure DockerServer:

| Environment Var. | Desc. | Default |
|---|---|---|
| `DS_PORT` | The port on which the DockerServer is running | 1717 |
| `DS_TOKEN` | The secret token for the authorization | xxxxxx |



#### Parameters
Also, you can start DockerServerwith these parameters:

| Param | Desc. | Default |
|---|---|---|
| `--port [num]` | The port on which the DockerServer is running | 1717 |
| `--token [string]` | The secret token for the authorization | xxxxxx |
| `--low_burst [num]` | Max number of requests per minute for Low burst. | 60 |
| `--mid_burst [num]` | Max number of requests per minute for Mid burst. | 180 |
| `--high_burst [num]` | Max number of requests per minute for High burst. | 300 |
| `--https` | Enable **HTTPS** mode.<br>For this you must have the following files:<br>&nbsp;&nbsp;&nbsp;&nbsp;a. /certs/cert.pem<br>&nbsp;&nbsp;&nbsp;&nbsp;b. /certs/privkey.pem<br>&nbsp;&nbsp;&nbsp;&nbsp;c. /certs/chain.pem (optional, to support self-signed certs) | false |
| `--cluster` | Enable **Cluster** mode. | false |
| `--folder` | Shared folder between all docker-servers. (Used only in cluster mode) | /tmp/docker-server |
| `--help` | Show help |  |
| `--version` | Show current version | &nbsp; |


#### PUT Data
When sending the PUT request, the following parameters are supported:

| Param | Desc. | Default | Docker cmd |
|---|---|---|---|
| image | The image for the run. (**required**) | null |  |
| name | The name of the container. | uuid4() | --name |
| remove | Flag to remove the container when it finishes `--rm` | false) | --rm |
| detach | Flag to detach the container `-d` | false) | -d |
| ports | **Map** of ports to publish. | null | -p |
| volumes | **Map** of volumes to mount. | null | -v |
| data | CMD to run inside the container. | null | &nbsp; |


#### POST Data
When sending the POST request, the following parameters are supported:

| Param | Desc. | Default | Docker CMD |
|---|---|---|---|
| data | CMD to run inside the container. | null |  |
| tty | Flag to enable TTY mode | false | -t |
| interactive | Flag to enable interactive mode | false | -i |

### Examples
NOTE: In the examples I assumed you're using the default port.

1. Get a list of all the containers:

`$ curl -X GET http://1.2.3.4:1717/ -H 'Authorization: Basic base64EncodedToken'`

2. Run redis on the remote machine:

`$ curl -X PUT http://1.2.3.4:1717/ -H 'Authorization: Basic base64EncodedToken' --data 'name=p-redis&image=redis&ports[1234]=6379'`

And/or

`$ curl -X PUT http://1.2.3.4:1717/ -H 'Authorization: Basic base64EncodedToken' --data 'name=v-redis&image=redis&volumes[/tmp/data]=/data'`

3. Remove our created container(s):

`$ curl -X DELETE http://1.2.3.4:1717/p-redis -H 'Authorization: Basic base64EncodedToken'`

And/or

`$ curl -X DELETE http://1.2.3.4:1717/v-redis -H 'Authorization: Basic base64EncodedToken'`


## Changelog

1.5.9 - Cluster mode using json files in a **shared folder** instead of Redis.

1.5.8 - **Cluster mode** support (Only some issues with POST to /:id) with **[Redis]("https://redis.io" "Redis")**.

1.5.7 - Badges :)

1.5.5 - Back to express-rate-limit && set min version to NodeJS 6.0.

1.5.4 - Returning to express-throttle for compatibitily (testing).

1.5.2 - Fixed typo in filename.

1.5.1 - Added test for [AppVeyor](https://appveyor.com/ "AppVeyor").

**1.5.0 - Stable HTTPS support.**

1.4.4-1.4.9 - Fixed some typos.

1.4.2 - Added HTTPS support & parametrized all env. variables.

1.4.1 - Removed unused DS_CONTEXT env. variable & received JS code quality A+ score on [LGTM](https://lgtm.com "LGTM").

1.2.9 - Fixed some typos.

1.2.7 - Replaced express-throttle with express-rate-limit.

1.2.5 - Stable, simple express server with express-throttle.

**1.0 - Release, woohoo!!**

## Roadmap
* Queue (for heavy loads)
* Autoscaling

## License
APACHE-2.0 (see the LICENSE files in the repository).