local key = KEYS[1]

local capacity = tonumber(ARGV[1])
local refillrate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')

local tokens = tonumber(bucket[1])
local lastrefill = tonumber(bucket[2])

if tokens == nil or lastrefill == nil then 
    tokens = capacity 
    lastrefill = now 
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


