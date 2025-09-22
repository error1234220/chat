const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};

// This part is problematic for serverless, but we leave it for the example
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('new user', (username) => {
    users[socket.id] = username;
    socket.broadcast.emit('user connected', username);
    io.emit('user list', Object.values(users));
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', { user: users[socket.id], msg: msg });
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing', users[socket.id]);
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing');
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    const disconnectedUser = users[socket.id];
    delete users[socket.id];
    if (disconnectedUser) {
      socket.broadcast.emit('user disconnected', disconnectedUser);
      io.emit('user list', Object.values(users));
    }
  });
});


// Serve the HTML file for all GET requests
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


// IMPORTANT CHANGE:
// We no longer call server.listen().
// Instead, we export the 'app' to be used by Vercel's runtime.
module.exports = app;
