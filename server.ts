// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const WebSocket = require('ws');

let latestPrice = 0
app.use(express.static(path.join(__dirname, 'public')));
// Endpoint to fetch the Bitcoin price
app.get('/bitcoin-price', async (req, res) => {
    res.json({price: latestPrice})
})

// Connect to Coinbase WebSocket for live Bitcoin price
let ws
function openSocket() {
    ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    ws.on('open', () => {
        console.log('Connected to Coinbase WebSocket');
        // Subscribe to the BTC-USD ticker
        const subscribeMessage = JSON.stringify({
            type: "subscribe",
            product_ids: ["BTC-USD"],
            channels: ["level2", "heartbeat", {name: "ticker", product_ids: ["BTC-USD"]}]
        });
        ws.send(subscribeMessage);
    });

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'ticker' && message.product_id === 'BTC-USD') {
            // Update the latest price
            latestPrice = parseFloat(message.price).toFixed(0);
        }
    });

    ws.on('error', (error) => {
        console.error("WebSocket error:", error);
    });

    ws.on('close', (msg) => {
        console.log(msg)
        console.log("WebSocket connection closed. Reconnecting...");
        setTimeout(() => {
            openSocket()
        }, 1000);
    });
}

openSocket()

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
