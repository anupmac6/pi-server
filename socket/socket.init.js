exports.onDisconnect = require("./onDisconnect/socket.disconnect");

exports.initialize = () => {
  //* register middleware for the sockets
  require("./middleware/socket.middleware").registerMiddleware();
  //* register event handler for socket on connection
  require("./onConnect/socket.connect").onConnection();
};
