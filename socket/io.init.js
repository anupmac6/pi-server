let io;

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer);

    require("./socket.init").initialize();
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io is not initialized!");
    }
    return io;
  },
};
