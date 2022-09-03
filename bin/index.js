const redis = require("../dist/index")

async function main() {
  const instance = await redis.initRedis({ port: 6379, host: "localhost" });

  const basement = new redis.Basement({
    streamName: "my-stream-test",
    frequency: 10_000,
    lastId: "0-0"
  });

  await basement.init();

  const info = await basement.getInfo();

  console.log(info);
}

main().catch(error => console.error(error));
