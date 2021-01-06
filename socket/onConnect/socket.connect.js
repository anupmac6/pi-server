const io = require("../io.init").getIO();
const webSocket = require("../socket.init");

exports.onConnection = () => {
  io.on("connection", async (socket) => {
    //* Initialize the ON DISCONNECT
    webSocket.onDisconnect(socket);
  });
};
