const { redisClient } = require('./redis'); 
const capacity = 10; 
const refil_rate = 1; 

const tokenBucketScript = `
local key = KEYS[1]

local capacity = tonumber(ARGV[1])
local refillrate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')

local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if tokens == nil or lastRefill == nil then 
    tokens = capacity 
    lastRefill = now 
end 

local elapsed = ( now - lastRefill ) / 1000

tokens = math.min(capacity, tokens + elapsed * refillrate) 

if tokens < 1 then 
    redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
    redis.call('EXPIRE', key, 3600)
    return {0, tokens}
end 

tokens = tokens - 1

redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)

redis.call('EXPIRE', key, 3600)

return {1, tokens}


`
async function consumeToken(key) {
    const date = Date.now(); 
    const result = await redisClient.eval(
        tokenBucketScript, {
            keys: [key], 
            arguments: [capacity.toString(), refil_rate.toString(), date.toString()]
        }
    );  
    const allowed = result[0] === 1; 
    const remainingTokens = result[1]; 
    let retryAfter = 0; 
    if(!allowed) {
        retryAfter = Math.ceil((1 - remainingTokens) / refil_rate); 
    }
    return {
        allowed, 
        remainingTokens,
        retryAfter
    }; 
}

module.exports = { 
    consumeToken, 
    capacity
}; 