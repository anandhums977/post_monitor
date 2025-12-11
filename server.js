// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// CORS for cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Store all received data
let dataHistory = [];

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Send existing data history to newly connected client
    socket.emit('initialData', dataHistory);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// POST endpoint to receive data from any device
app.post('/api/data', (req, res) => {
    const receivedData = {
        data: req.body,
        timestamp: new Date().toISOString(),
        source: req.ip || req.connection.remoteAddress,
        id: Date.now()
    };
    
    console.log('Received POST from:', receivedData.source);
    console.log('Data:', req.body);
    
    // Store data
    dataHistory.unshift(receivedData);
    
    // Keep only last 50 entries
    if (dataHistory.length > 50) {
        dataHistory = dataHistory.slice(0, 50);
    }
    
    // Broadcast to all connected clients in real-time
    io.emit('newData', receivedData);
    
    res.json({ 
        success: true, 
        message: 'Data received and broadcasted',
        dataId: receivedData.id
    });
});

// GET endpoint to retrieve all data
app.get('/api/data', (req, res) => {
    res.json(dataHistory);
});

// Start server
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 POST endpoint: http://localhost:${PORT}/api/data`);
    console.log(`🔌 WebSocket ready for real-time updates`);
});
