const dotenv = require("dotenv");
dotenv.config();

// Third-party Dependencies
const { GenericContainer } = require("testcontainers");

// VARS & Config
const kRedisPort = 6379;
let redis;

module.exports = async function startContainers() {
  console.info("\nStarting containers ...");

  try {
    console.info("Starting redis ...");
    redis = await new GenericContainer("redis")
      .withExposedPorts(kRedisPort)
      .start();
  }
  catch (error) {
    console.error(error);

    throw new Error("Error during spawn a redis container");
  }
};

process.on("SIGTERM", () => {
  if (redis && redis.stop) {
    redis.stop();
  }
});
