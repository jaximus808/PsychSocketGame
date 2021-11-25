//could maybe use bree here, lmao
module.exports = class GameManager
{
  constructor(io,playerManager)
  {
    this.io = io;
    this.playerManager = playerManager;
  
    this.io.on(`connection`, (socket) =>
    {
      //init data
      socket.emit(`test`,`hiiii`);
    })
  }
  

}