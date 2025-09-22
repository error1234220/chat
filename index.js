const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// --- CRITICAL FIX ---
// This tells Express to serve the index.html file for the homepage.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// This object will store the usernames associated with each socket ID
const users = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Event for when a new user joins
  socket.on('new user', (username) => {
    users[socket.id] = username;
    // Broadcast to all other users that a new user has connected
    socket.broadcast.emit('user connected', username);
    // Send the updated list of online users to everyone
    io.emit('user list', Object.values(users));
  });

  // Event for when a new chat message is sent
  socket.on('chat message', (msg) => {
    const senderUsername = users[socket.id] || 'Anonymous';
    // Broadcast the message to everyone, including the sender
    io.emit('chat message', { user: senderUsername, msg: msg });
  });

  // Event for when a user is typing
  socket.on('typing', () => {
    const typingUser = users[socket.id] || 'Someone';
    // Broadcast to other users that this user is typing
    socket.broadcast.emit('typing', typingUser);
  });

  // Event for when a user stops typing
  socket.on('stop typing', () => {
    // Broadcast to other users that the typing has stopped
    socket.broadcast.emit('stop typing');
  });

  // Event for when a user disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const disconnectedUser = users[socket.id];
    delete users[socket.id];
    if (disconnectedUser) {
      // Broadcast to all other users that this user has left
      socket.broadcast.emit('user disconnected', disconnectedUser);
      // Send the updated list of online users to everyone
      io.emit('user list', Object.values(users));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
