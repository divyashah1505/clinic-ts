const { createClient } = require("redis");

const client = createClient({
    url: "redis://127.0.0.1:6379",
    socket: {
        connectTimeout: 10000, 
        reconnectStrategy: (retries: number) => {
            if (retries > 10) return new Error("Redis connection failed");
            return Math.min(retries * 100, 3000); 
        }
    }
});

client.on("error", (err: any) => {
    if (err.code !== 'ECONNREFUSED') {
        console.error("Redis Client Error:", err.message);
    }
});

client.on("ready", () => console.log(" Redis Client Ready"));

async function connectRedis() {
    try {
        if (!client.isOpen) {
            await client.connect();
            console.log(" Redis Connected");
        }
    } catch (err) {
        console.error(" Redis Connection Failed:", err);
    }
}

connectRedis();

module.exports = client;
