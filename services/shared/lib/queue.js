import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL);
export const queue = {
  publish: async (topic, payload) => {
    return redis.publish(topic, JSON.stringify(payload));
  },
  subscribe: (topic, handler) => {
    const sub = new Redis(process.env.REDIS_URL);
    sub.subscribe(topic);
    sub.on("message", (_, msg) => {
      try {
        handler(JSON.parse(msg));
      } catch (e) {
        console.error("queue handler parse error", e);
      }
    });
  },
};
