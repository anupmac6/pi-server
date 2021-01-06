const io = require("../io.init").getIO();

exports.registerMiddleware = () => {
  //* register a new middleware for the socket

  io.use((socket, next) => {
    //* grab the token from the handshake
    const token = socket.handshake.query.token;
    //! if no token is provided then throw error ( middleware will ignore this socket connection )
    if (!token) {
      return next(new Error("No Token Provided!"));
    }

    // TODO Add your logic here
    return next();
  });
};
