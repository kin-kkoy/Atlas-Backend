const { Server } = require('socket.io');

let io = null;

module.exports = {
  init: (server) => {
    if (!io) {
      io = new Server(server, {
        cors: {
          origin: "http://localhost:5173",
          methods: ["GET", "POST", "PUT", "DELETE"],
          credentials: true
        }
      });

      io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('joinUserRoom', (userId) => {
          socket.join(userId);
          console.log(`Socket ${socket.id} joined user room ${userId}`);
        });

        socket.on('disconnect', () => {
          console.log('User disconnected:', socket.id);
        });
      });
    }
    return io;
  },
  getIO: () => {
    if (!io) {
      return null;
    }
    return io;
  }
};