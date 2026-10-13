const { createClient } = require('redis'); 

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
}); 

redisClient.on('error', (err) => {
    console.log('Redis client error', err); 
}); 

async function connectRedis() {
    await redisClient.connect(); 
    console.log('Connected to Redis'); 
}
module.exports = { redisClient, connectRedis }; 


