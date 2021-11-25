//could maybe use bree here, lmao
module.exports = class GameManager
{
  constructor(io,playerManager)
  {
    this.cookie = require("cookie")
    this.io = io;
    this.playerManager = playerManager;
  
    this.io.on(`connection`, (socket) =>
    {
      //init data

// playerManager.PlayerConnect(`jwwqs`,`swag`)

// playerManager.PlayerDisconnect(`jwwqs`)
    var cookief = socket.handshake.headers.cookie; 
    var cookies = this.cookie.parse(socket.handshake.headers.cookie);  
      socket.emit(`test`,`hiiii`);
      this.playerManager.PlayerConnect(socket.id,cookies.usernameSet )
    
      socket.on("disconnect", ()=>
      {
        this.playerManager.PlayerDisconnect(socket.id);
      })
    })
  }
  

}