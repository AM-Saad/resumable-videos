let io;

module.exports = {
  init: httpServer => {
    io = require("socket.io")(httpServer,{allowEIO3: true});
    return io
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket Not Initialized')
    }
    return io;
  }
};
