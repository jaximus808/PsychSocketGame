//could maybe use bree here, lmao
module.exports = class GameManager
{
  constructor(io,playerManager, map)
  {
    this.cookie = require("cookie")
    this.io = io;
    this.playerManager = playerManager;
    this.playerManager.GameManager = this; 
    this.io.on(`connection`, (socket) =>
    {
      var cookief = socket.handshake.headers.cookie; 
      var cookies = this.cookie.parse(socket.handshake.headers.cookie);  
      socket.emit(`test`,`hiiii`);
      this.playerManager.PlayerConnect(socket.id,cookies.usernameSet )
      
      socket.emit("GameInformation", JSON.stringify({
        map: this.map,
      }))
      
      socket.on("disconnect", ()=>
      {
        this.playerManager.PlayerDisconnect(socket.id);
      })
    })

    this.map = map; 
    this.playerGameInformation = {};
    // 0 means waiting for admin, 1 means playing, 
    this.gamestate = 0
  }

  CreatePlayer(_id)
  {
    // this.playerGameInformation[_id] = 
    // {
    //   posX: 
    // }
  }


}