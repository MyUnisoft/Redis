<h1 align="center">
  Local instance installation guide
</h1>

## MAC

### Install Redis server

> you can follow all steps for a quick start [on this page](https://redis.io/topics/quickstart)

1. download tar file from [here](http://download.redis.io/redis-stable.tar.gz)
2. ```$ cd redis-stable```
3. ```$ sudo make install  ```
4. check if ioredis (dependencies) and @types/ioredis(devDependencies) is provided in package.json

### Launch the server

First of all, you must open a terminal and launch the server
```bash
$ redis-server
$ redis-cli ping
// output PONG 
// congratulation, you have just checked 
// if server is working, and it's works.
```

## Windows
- https://github.com/microsoftarchive/redis/releases
