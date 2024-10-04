const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Create an Express application
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store connected users
const connectedUsers = {};

// Serve the index.html file to the client
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle client connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for a user to set their name and channel
    socket.on('join channel', ({ name, channel, code }) => {
        connectedUsers[socket.id] = { name, channel, code }; // Store user details
        console.log(`${name} joined channel: ${channel}`);

        // Notify the user they have joined the chat
        socket.emit('message', { username: 'System', message: 'You have joined the chat.' });

        // Broadcast to the channel that the user has joined
        socket.join(channel); // Join the socket to the channel
        io.to(channel).emit('message', { username: 'System', message: `${name} has joined the channel.` });
    });

    // Listen for chat messages
    socket.on('chat message', (data) => {
        const senderDetails = connectedUsers[socket.id];
        if (senderDetails) {
            const message = {
                from: senderDetails.name,
                message: data.message,
                timestamp: Date.now() // Include a proper timestamp
            };

            // Emit the message to all users in the same channel
            io.to(senderDetails.channel).emit('chat message', message);
        }
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        const userDetails = connectedUsers[socket.id];
        if (userDetails) {
            console.log(`${userDetails.name} disconnected from channel: ${userDetails.channel}`);
            io.to(userDetails.channel).emit('message', { username: 'System', message: `${userDetails.name} has left the channel.` });
            delete connectedUsers[socket.id]; // Remove the user from connected users
        } else {
            console.log('User disconnected');
        }
    });
});

// Define the host and port
const HOST = '192.168.1.129'; // Your actual local IP address
const PORT = 3003; // Change to any available port

// Start the server
server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
