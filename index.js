const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// This serves the static files from the public directory
app.use(express.static(path.join(__dirname)));

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
    // Broadcast the message to everyone, including the sender
    io.emit('chat message', { user: users[socket.id], msg: msg });
  });

  // Event for when a user is typing
  socket.on('typing', () => {
    // Broadcast to other users that this user is typing
    socket.broadcast.emit('typing', users[socket.id]);
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
