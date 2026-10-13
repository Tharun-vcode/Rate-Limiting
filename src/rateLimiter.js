const { consumeToken, capacity } = require('./tokenBucket'); 
async function rateLimiter(req, res, next) {
    try {
        let clientId = req.ip; 
        if(clientId === "::1"){
            clientId = '127.0.0.1'
        }
        const key = `rate-limit:${clientId}`; 
        const result = await consumeToken(key); 

        console.log("Client ID: ", clientId);
        console.log("Redis Key: ", key);

        res.setHeader('X-RateLimit-Limit', capacity);
        res.setHeader('X-RateLimit-Remaining', Math.floor(result.remainingTokens)); 
        if(!result.allowed) {
            res.setHeader('Retry-After', result.retryAfter);
            return res.status(429).json({
                error: "Too many requests.", 
                retryAfter: result.retryAfter
            }); 
        }
        next(); 
    }
    catch(error){
            console.error("Error in rate limiter:", error); 
            res.status(500).json({
                error: "Internal server error in rate limiter"
            }); 
        }
}

module.exports = rateLimiter; 