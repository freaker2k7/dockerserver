# DockerServer
Simple REST server for running docker images from remote machine.

## Install
`npm install -g git+https://github.com/freaker2k7/dockerserver`

## Background
I needed to run a couple of containers on a remote machine and came to these conclusions:
* Kubernetes is an overkill !
* docker-machine is also complicated !
* I just want to run a few containers...

## Approach
Built a small REST server with NodeJS, using the `express` and `docker-cli-js` packages as a base.

## Design Principles
* Docker is (a) present.
* Keep the business logic simple!
* It must be stateless!

## Usage
Install DockerServer on the machine that you want to run your containers.

DockerServer can be run for a single session with:<br>
`$ docker-server`<br>
or as a service using [PM2](https://pm2.keymetrics.io/ "PM2"):<br>
`$ pm2 start /usr/lib/node_modules/docker-server/pm2.config.js`<br>
and if you want in addition to start it on startup just run:<br>
`$ pm2 startup`

Now, you can do "remote" docker operation using simple HTTP requests:

1. GET / - List all the containers (docker ps -a)
2. GET /:id - Show the logs of a specific (docker logs :id)
3. PUT / - Run a container (docker run...)
4. DELETE /:id - Delete a container with such a name or an ID (docker rm -f :id)

### Options
#### Environment
You can set the following environment variables to configure DockerServer:

1. `DS_CONTEXT` - The base context directory (default: /home/ubuntu)
2. `DS_PORT` - The port on which the DockerServer is running (default: 1717)
3. `DS_TOKEN` - The secret token for the authorization (default: xxxxxxxxxxxxxxxxxxxxxxxx)

#### PUT Data
When sending the PUT request, the following parameters are supported:

1. image - The image for the run (**required**) (default: null)
2. name - The name of the container (default: uuid4())
3. remove - Flag to remove the container when it finishes `--rm` (default: false).
4. detach - Flag to detach the container `-d` (default: false).
5. ports - **Map** of ports to promote (default: null)
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

### License
APACHE-2.0 (see the LICENSE files in the repository).