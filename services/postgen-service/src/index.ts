import dotenv from 'dotenv';
import { queue } from './lib/queue.js';
import './workers/onInsightNew.js';
dotenv.config();
console.log("Postgen worker started - listening for insight.new events");
