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
    this.speed = 5;
    this.io.on(`connection`, (socket) =>
    {
      if(!socket.handshake.headers.cookie) 
      {
        socket.emit("redirectHome")
        return;
      }
      var cookies = this.cookie.parse(socket.handshake.headers.cookie);  
      socket.emit(`test`,`hiiii`);
      const playerData = this.playerManager.PlayerConnect(socket.id,cookies.usernameSet )
      
      this.CreatePlayer(socket.id, playerData.teamId, playerData.username)
      socket.broadcast.emit("newPlayerConnection", socket.id,this.playerGameInformation[socket.id].x, this.playerGameInformation[socket.id].y, this.playerGameInformation[socket.id].teamId,this.playerGameInformation[socket.id].username)

      socket.emit("GameInformation", JSON.stringify({
        map: this.map,
        playerData: this.playerGameInformation
      }))
      
      socket.on("playerInput", (keys) =>
      {
        this.Movement(keys,socket.id)
        
        socket.broadcast.emit("playerInput",socket.id,this.playerGameInformation[socket.id].posX,this.playerGameInformation[socket.id].posY)
        socket.emit("localPlayerMovement",this.playerGameInformation[socket.id].posX,this.playerGameInformation[socket.id].posY)
      })

      socket.on("disconnect", ()=>
      {
        this.playerManager.PlayerDisconnect(socket.id);
        delete this.playerGameInformation[socket.id]
        io.emit("playerDisconnect", socket.id)
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

  Movement(keys,id)
  {
    // let tempX = this.playerGameInformation[socket.id].posX;
    // let tempY = this.playerGameInformation[socket.id].posY;
    const playerInfo = this.playerGameInformation[id];
    let width = 20;
    //w
    if(keys[0])
    {
      let tempY = playerInfo.posY+ this.speed;
      if(this.map[Math.floor((tempY+width*2)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-5)/this.obSize)] != 1 &&this.map[Math.floor((tempY+width*2)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-10)/this.obSize)] != 1&&this.map[Math.floor((tempY+width)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-20)/this.obSize)] != 1)
      {
        playerInfo.posY = tempY
      }
    }
    //s
    if(keys[1])
    {
      let tempY = playerInfo.posY- this.speed;
      if(this.map[Math.floor((tempY+width)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-5)/this.obSize)] != 1&&this.map[Math.floor((tempY+width)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-10)/this.obSize)] != 1&&this.map[Math.floor((tempY+width)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-20)/this.obSize)] != 1)
      {
        playerInfo.posY = tempY
      }
    }
    //a
    if(keys[2])
    {
      let tempX = playerInfo.posX+ this.speed;
      if(this.map[Math.floor((playerInfo.posY+width)/this.obSize)*this.xCount + Math.floor((tempX+width*2)/this.obSize)] != 1&&this.map[Math.floor((playerInfo.posY+width+10)/this.obSize)*this.xCount + Math.floor((tempX+width*2)/this.obSize)] != 1&&this.map[Math.floor((playerInfo.posY+width+15)/this.obSize)*this.xCount + Math.floor((tempX+width*2)/this.obSize)] != 1)
      {
        playerInfo.posX = tempX
      }
    }
    //d
    if(keys[3])
    {
      let tempX = playerInfo.posX- this.speed;
      if(this.map[Math.floor((playerInfo.posY+width)/this.obSize)*this.xCount + Math.floor((tempX+width)/this.obSize)] != 1&&this.map[Math.floor((playerInfo.posY+width+5)/this.obSize)*this.xCount + Math.floor((tempX+width)/this.obSize)] != 1&&this.map[Math.floor((playerInfo.posY+width+15)/this.obSize)*this.xCount + Math.floor((tempX+width*2)/this.obSize)] != 1)
      {
        playerInfo.posX = tempX
      }
    }

    // if(keys[0])
    // {
    //   this.playerGameInformation[socket.id].posY += this.speed;
    // }
    // if(keys[1])
    // {
    //   this.playerGameInformation[socket.id].posY -= this.speed;
    // }
    // if(keys[2])
    // {
    //   this.playerGameInformation[socket.id].posX += this.speed;
    // }
    // if(keys[3])
    // {
    //   this.playerGameInformation[socket.id].posX -= this.speed;
    // }

  }

  CreatePlayer(_id, _teamId,_username)
  {
    
    const data = 
    {
      posX: this.teamSpawns[_teamId].posX +(Math.random()*this.teamSpawns[_teamId].radSpawn) *(Math.random()*2-1),
      posY: this.teamSpawns[_teamId].posY +(Math.random()*this.teamSpawns[_teamId].radSpawn)*(Math.random()*2-1),
      teamId: _teamId,
      username: _username
    }
    this.playerGameInformation[_id] = data
    return data; 

  }


}