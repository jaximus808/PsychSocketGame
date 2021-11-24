module.exports = (io) =>
{
  io.on(`connection`, (socket) =>
  {
    //init data
    socket.emit(`test`,`hiiii`);
  })
}