"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
exports.createQueue = createQueue;
exports.checkRedisConnection = checkRedisConnection;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
// Shared Redis connection
exports.redisConnection = new ioredis_1.default({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
});
// Queue factory
function createQueue(name) {
    return new bullmq_1.Queue(name, {
        connection: exports.redisConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: {
                count: 100, // Keep last 100 completed jobs
            },
            removeOnFail: {
                count: 500, // Keep last 500 failed jobs
            },
        },
    });
}
// Health check
async function checkRedisConnection() {
    try {
        await exports.redisConnection.ping();
        return true;
    }
    catch (error) {
        console.error('Redis connection failed:', error);
        return false;
    }
}
