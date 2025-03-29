import Redis from "ioredis";

// Function to test Redis connection
async function testRedisConnection() {
  try {
    // Use environment variables or default to localhost
    const host = process.env.REDIS_HOST || "localhost";
    const port = process.env.REDIS_PORT || "6379";
    const username = process.env.REDIS_USERNAME || "";
    const password = process.env.REDIS_PASSWORD || "";
    const useTls = process.env.REDIS_TLS === "true";

    // Build Redis URL
    let redisUrl;
    if (username && password) {
      redisUrl = `redis://${username}:${password}@${host}:${port}`;
    } else if (password) {
      redisUrl = `redis://:${password}@${host}:${port}`;
    } else {
      redisUrl = `redis://${host}:${port}`;
    }

    console.log(
      `Testing connection to Redis at: ${redisUrl.replace(/:[^:]*@/, ":***@")}`
    );

    // Create Redis client
    const client = new Redis(redisUrl, {
      tls: useTls ? {} : undefined,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    });

    // Handle connection events
    client.on("connect", () => {
      console.log("Successfully connected to Redis");
    });

    client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    // Test operations
    console.log("Testing Redis operations...");

    // Set a test value
    await client.set("test_key", "Hello from BlogStack!");
    console.log("Successfully set test_key");

    // Get the test value
    const value = await client.get("test_key");
    console.log("Retrieved test_key value:", value);

    // Test pub/sub by creating a duplicate client
    const subClient = client.duplicate();

    // Subscribe to a test channel
    await subClient.subscribe("test_channel");
    console.log("Subscribed to test_channel");

    // Set up message handler
    subClient.on("message", (channel, message) => {
      console.log(`Received message on ${channel}: ${message}`);

      // Cleanup after successful test
      setTimeout(async () => {
        await client.del("test_key");
        client.disconnect();
        subClient.disconnect();
        console.log("Redis test completed successfully");
      }, 1000);
    });

    // Publish a test message
    await client.publish("test_channel", "Test message from BlogStack");
    console.log("Published test message to test_channel");
  } catch (error) {
    console.error("Redis test failed:", error);
  }
}

// Run the test
testRedisConnection();
