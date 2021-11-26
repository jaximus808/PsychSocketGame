//could maybe use bree here, lmao
module.exports = class GameManager
{
  constructor(io,playerManager, map)
  {
    this.obSize = 64;
    this.cookie = require("cookie")
    this.io = io;
    this.playerManager = playerManager;
    this.playerManager.GameManager = this; 
    this.io.on(`connection`, (socket) =>
    {
      var cookies = this.cookie.parse(socket.handshake.headers.cookie);  
      socket.emit(`test`,`hiiii`);
      const playerData = this.playerManager.PlayerConnect(socket.id,cookies.usernameSet )
      
      const ingamePlayerData = this.CreatePlayer(socket.id, playerData.teamId)

      socket.emit("GameInformation", JSON.stringify({
        map: this.map,
        localPlayerData: ingamePlayerData
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
    this.teamSpawns = {}; 
    this.xCount = map.length/34; 
    this.SetMapElements();
  }

  SetMapElements()
  {
    for(let i = 0; i < this.map.length; i++)
    {
      if(this.map[i] < 0)
      {
        this.teamSpawns[this.map[i]*-1 -1] = 
        {
          posX: (i-Math.floor(i/this.xCount)*this.xCount) * this.obSize,
          posY: Math.floor(i/this.xCount) *this.obSize,
          radSpawn: 120,
        }
      }
    }
    console.log(this.teamSpawns)
  }

  CreatePlayer(_id, _teamId)
  {
    
    const data = 
    {
      posX: this.teamSpawns[_teamId].posX +(Math.random()*this.teamSpawns[_teamId].radSpawn) *(Math.random()*2-1),
      posY: this.teamSpawns[_teamId].posY +(Math.random()*this.teamSpawns[_teamId].radSpawn)*(Math.random()*2-1),
      teamId: _teamId,
    }
    this.playerGameInformation[_id] = data
    return data; 

  }


}