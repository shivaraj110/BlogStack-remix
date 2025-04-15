export const getRedisConfig = () => {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    return {
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    };
  } else {
    throw new Error("REDIS CREDENTIALS NOT FOUND!");
  }
};
