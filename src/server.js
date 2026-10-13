const express = require("express"); 
const redis = require("./redis");
const rateLimiter  = require("./rateLimiter"); 

const app = express(); 

app.use(express.json()); 

app.get("/", rateLimiter, (req, res) => {
    res.json({
        message: "Request Allowed."
    }); 
}); 

async function startServer() {
    await redis.connectRedis(); 

    app.listen(3000, () => {
        console.log("Server running on port 3000"); 
    }); 
}

startServer(); 