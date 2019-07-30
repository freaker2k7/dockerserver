# DockerServer
Super lightweight & simple RESTFul stateless server for running [docker](https://docker.com/ "docker") containers on a remote machine(s) in a secure way.

[![npm version](https://badge.fury.io/js/docker-server.svg)](https://badge.fury.io/js/docker-server)
[![node version](https://img.shields.io/node/v/docker-server)](https://www.npmjs.com/package/docker-server)
[![npm downloads](https://img.shields.io/npm/dw/docker-server.svg)](https://www.npmjs.com/package/docker-server)
[![Gitter](https://badges.gitter.im/freaker2k7-dockerserver/community.svg)](https://gitter.im/freaker2k7-dockerserver/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/freaker2k7/dockerserver.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/freaker2k7/dockerserver/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/freaker2k7/dockerserver.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/freaker2k7/dockerserver/context:javascript)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/freaker2k7/dockerserver/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/freaker2k7/dockerserver/?branch=master)
[![License](https://img.shields.io/badge/license-Apache-brightgreen.svg)](https://opensource.org/licenses/Apache-2.0)
[![Bungle size](https://img.shields.io/bundlephobia/minzip/docker-server)](https://bundlephobia.com/result?p=docker-server)
[![Repo size](https://img.shields.io/github/repo-size/freaker2k7/dockerserver)](https://github.com/freaker2k7/dockerserver)
[![Build status](https://ci.appveyor.com/api/projects/status/rwbo4jvqp4032boj/branch/master?svg=true)](https://ci.appveyor.com/project/freaker2k7/dockerserver/branch/master)
<!-- [![Known Vulnerabilities](https://snyk.io//test/github/freaker2k7/dockerserver/badge.svg?targetFile=package.json)](https://snyk.io//test/github/freaker2k7/dockerserver) -->
[![Beerpay](https://beerpay.io/freaker2k7/dockerserver/badge.svg?style=flat)](https://beerpay.io/freaker2k7/dockerserver)
[![Liberapay](http://img.shields.io/liberapay/receives/evgy.svg?logo=liberapay)](https://liberapay.com/evgy/)
[![GitHub stars](https://img.shields.io/github/stars/freaker2k7/dockerserver.svg?style=social&label=Stars)](https://github.com/freaker2k7/dockerserver/stargazers/)


<center>
  <a href="https://dockerserver.io/" title="DockerServer Logo" target="_blank">
    <img src="https://i.imgur.com/14Cypln.png" alt="DockerServer Logo" title="DockerServer Logo" style="box-shadow: none;" style="max-width: 100%; border: 0; box-shadow: none;">
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
* I just want to run a few containers on a remote machine.

## Approach
Built a small REST server with NodeJS, using the `express` and `docker-cli-js` packages as a base.

### Design Principles
* Keep the business logic **simple**!
* It must be **stateless**!
* **Docker** is (a) present.

### Current architecture
<center>
  <img src="https://i.imgur.com/1LqU37z.png" alt="How things work today" style="max-width: 100%; border: 0; box-shadow: none;" /><br>
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

<table style="table-layout: fixed; width: 100%; word-break: break-word;">
  <tr>
    <th>HTTP Method</th>
    <th>Endpoint</th>
    <th>Desc.</th>
    <th>Docker cmd</th>
  </tr>
  <tr>
    <td>HEAD</td>
    <td>/:id*</td>
    <td>Pull an image</td>
    <td>docker pull :id</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/</td>
    <td>List all the containers</td>
    <td>docker ps -a</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/:id</td>
    <td>Show the logs of a specific container</td>
    <td>docker logs :id</td>
  </tr>
  <tr>
    <td>PUT</td>
    <td>/</td>
    <td>Run a container</td>
    <td>docker run...</td>
  </tr>
  <tr>
    <td>POST</td>
    <td>/:id</td>
    <td>Execute a command in a container</td>
    <td>docker exec...</td>
  </tr>
  <tr>
    <td>DELETE</td>
    <td>/:id</td>
    <td>Delete a container with such a name or an ID</td>
    <td>docker rm -f :id</td>
  </tr>
</table>
<br>

## Options
### Environment
You can set the following environment variables to configure DockerServer:

<table style="table-layout: fixed; width: 100%; word-break: break-word;">
  <tr>
    <th>Environment Var.</th>
    <th>Desc.</th>
    <th>Default</th>
  </tr>
  <tr>
    <td><code>DS_PORT</code></td>
    <td>The port on which the DockerServer is running</td>
    <td>1717</td>
  </tr>
  <tr>
    <td><code>DS_TOKEN</code></td>
    <td>The secret token for the authorization</td>
    <td>xxxxxx</td>
  </tr>
</table>

### Parameters
Also, you can start DockerServerwith these parameters:

<table style="table-layout: fixed; width: 100%; word-break: break-word;">
  <tr>
    <th>Param</th>
    <th>Desc.</th>
    <th>Default</th>
  </tr>
  <tr>
    <td><code>--port [num]</code></td>
    <td>The port on which the DockerServer is running</td>
    <td>1717</td>
  </tr>
  <tr>
    <td><code>--token [string]</code></td>
    <td>The secret token for the authorization</td>
    <td>xxxxxx</td>
  </tr>
  <tr>
    <td><code>--low_burst [num]</code></td>
    <td>Max number of requests per minute for Low burst.</td>
    <td>60</td>
  </tr>
  <tr>
    <td><code>--mid_burst [num]</code></td>
    <td>Max number of requests per minute for Mid burst.</td>
    <td>180</td>
  </tr>
  <tr>
    <td><code>--high_burst [num]</code></td>
    <td>Max number of requests per minute for High burst.</td>
    <td>300</td>
  </tr>
  <tr>
    <td><code>--https</code></td>
    <td>
      Enable <b>HTTPS</b> mode.<br>
      For this you must have the following files:<br>
        &nbsp;&nbsp;&nbsp;&nbsp;a. /certs/cert.pem<br>
        &nbsp;&nbsp;&nbsp;&nbsp;b. /certs/privkey.pem<br>
        &nbsp;&nbsp;&nbsp;&nbsp;c. /certs/chain.pem (optional, to support self-signed certs)
    </td>
    <td>false</td>
  </tr>
  <tr>
    <td><code>--cluster</code></td>
    <td>Enable <b>Cluster</b> mode.</td>
    <td>false</td>
  </tr>
  <tr>
    <td><code>--refresh_rate [num]</code></td>
    <td>Milliseconds between writes to the shared memory</td>
    <td>30000</td>
  </tr>
  <tr>
    <td><code>--cache_interval [num]</code></td>
    <td>Milliseconds to cache reads of all the machines</td>
    <td>3000</td>
  </tr>
  <tr>
    <td><code>--folder [path]</code></td>
    <td>Shared folder between all docker-servers. (Used only in cluster mode)</td>
    <td>/tmp/docker-server</td>
  </tr>
  <tr>
    <td><code>--s3 [bucket-name]</code></td>
    <td>
      S3 bucket name, use with high refresh_rate.<br>
      If set, the `--folder` param. becomes the Key.
    </td>
    <td>null</td>
  </tr>
  <tr>
    <td><code>--log_lovel [option]</code></td>
    <td>Log level [trace|debug|info|warn|error|fatal]</td>
    <td>info</td>
  </tr>
  <tr>
    <td><code>--log_expiry [num]</code></td>
    <td>Time for a log to live in days.</td>
    <td>14</td>
  </tr>
  <tr>
    <td><code>--log_max_size [num]</code></td>
    <td>Max log size in MB</td>
    <td>25</td>
  </tr>
  <tr>
    <td><code>--help</code></td>
    <td>Show he</td>
    <td>&nbsp;</td>
  </tr>
  <tr>
    <td><code>--version</code></td>
    <td>Show current version </td>
    <td>&nbsp;</td>
  </tr>
</table>

### PUT Data
When sending the PUT request, the following parameters are supported:

<table style="table-layout: fixed; width: 100%; word-break: break-word;">
  <tr>
    <th>Param</th>
    <th>Desc.</th>
    <th>Default</th>
    <th>Docker cmd</th>
  </tr>
  <tr>
    <td>image</td>
    <td>The image for the run. (<b>required</b>)</td>
    <td>null</td>
    <td>&nbsp;</td>
  </tr>
  <tr>
    <td>name</td>
    <td>The name of the container.</td>
    <td>uuid4()</td>
    <td><code>--name</code></td>
  </tr>
  <tr>
    <td>remove</td>
    <td>Flag to remove the container when it finishes <code>--rm</code></td>
    <td>false</td>
    <td><code>--rm</code></td>
  </tr>
  <tr>
    <td>detach</td>
    <td>Flag to detach the container <code>-d</code></td>
    <td>false</td>
    <td><code>-d</code></td>
  </tr>
  <tr>
    <td>ports</td>
    <td><b>Map</b> of ports to publish.</td>
    <td>null</td>
    <td><code>-p</code></td>
  </tr>
  <tr>
    <td>volumes</td>
    <td><b>Map</b> of volumes to mount.</td>
    <td>null</td>
    <td><code>-v</code></td>
  </tr>
  <tr>
    <td>data</td>
    <td>CMD to run inside the container.</td>
    <td>null</td>
    <td>&nbsp;</td>
  </tr>
</table>

### POST Data
When sending the POST request, the following parameters are supported:

<table style="table-layout: fixed; width: 100%; word-break: break-word;">
  <tr>
    <th>Param</th>
    <th>Desc.</th>
    <th>Default</th>
    <th>Docker cmd</th>
  </tr>
  <tr>
    <td>data</td>
    <td>CMD to run inside the container</td>
    <td>null</td>
    <td>&nbsp;</td>
  </tr>
  <tr>
    <td>tty</td>
    <td>Flag to enable TTY mode</td>
    <td>false</td>
    <td><code>-t</code></td>
  </tr>
  <tr>
    <td>interactive</td>
    <td>Flag to enable interactive mode</td>
    <td>false</td>
    <td><code>-i</code></td>
  </tr>
</table>

## Examples
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

1.8.5 - Added **docker pull** option as a HEAD request && **S3 support** for fully distributed clusters.

1.8.4 - Edited some docs.

[See full changelog](https://github.com/freaker2k7/dockerserver/blob/master/CHANGELOG.md)

## Roadmap
* Queue (for heavy loads)
* Autoscaling
* S3 support (wrap fs)

## License
APACHE-2.0 (see the LICENSE files in the repository).

## Donate
Running dockers is free, but **beer** is always welcome <a href="https://beerpay.io/freaker2k7/dockerserver">
  <img style="display: inline-block; vertical-align: text-bottom;" alt="Beerpay" src="https://beerpay.io/freaker2k7/dockerserver/badge.svg?style=beer">
</a>
or directly donate to our cause <a href="https://liberapay.com/evgy/donate">
  <img style="display: inline-block; vertical-align: text-bottom;" alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg">
</a>