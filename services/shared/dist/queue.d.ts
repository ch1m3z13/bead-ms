import { Queue } from 'bullmq';
import Redis from 'ioredis';
export declare const redisConnection: Redis;
export declare function createQueue<T = any>(name: string): Queue<T>;
export declare function checkRedisConnection(): Promise<boolean>;
