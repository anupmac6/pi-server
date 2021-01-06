module.exports = async (socket) => {
  socket.on("disconnect", async () => {
    //* Clean up stuff when the socket disconnects
  });
};
