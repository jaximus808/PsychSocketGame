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
    this.bree = require("bree");
    this.currentGameJob;
    this.gameTimer = 0;
    this.timeLength = 300
    this.food ={}; 
    //A = 0, B = 1, C = 2, D = 3
    this.questions =
    {
      0:
      {
        prompt:"Why might removing food cues help with waist management? <br>A: Out of sight out of mind, <br>B: if we eat less then we create less waist, <br> C: The sight of food triggers the hippothalamus that makes it harder to manage waist<br>D: It is from our caveman times ",
        ans: 0
      }
    }

    //this.collision = new require("detect-collisions")();
    this.teamData = 
    {
      0:{
        points:0
      },
      1:{
        points:0
      },
      2:{
        points:0
      },
      3:{
        points:0
      }
    }
    this.io.on(`connection`, (socket) =>
    {
      if(!socket.handshake.headers.cookie) 
      {
        socket.emit("redirectHome")
        return;
      }
      var cookies = this.cookie.parse(socket.handshake.headers.cookie);  
      socket.emit(`test`,`Connected!`);
      const playerData = this.playerManager.PlayerConnect(socket.id,cookies.usernameSet )
      
      this.CreatePlayer(socket.id, playerData.teamId, playerData.username)
      socket.broadcast.emit("newPlayerConnection", socket.id,this.playerGameInformation[socket.id].x, this.playerGameInformation[socket.id].y, this.playerGameInformation[socket.id].teamId,this.playerGameInformation[socket.id].username)

      socket.emit("GameInformation", JSON.stringify({
        map: this.map,
        playerData: this.playerGameInformation,
        feederInfo: this.feederSpawn,
        food: this.food
      }))
      socket.broadcast.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", `${cookies.usernameSet} has joined!` )
      
      socket.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", `Welcome to the Ant Game!` )
      
      socket.on("answer", (ans, qID, foodId) =>
      {
        let letValue = ["A","B","C","D"]
        if(ans == this.questions[qID].ans)
        {
          console.log("correct")
          socket.emit("qResponse", true)
          socket.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", `You got that correct! Bring your food home solider!` )
          this.playerGameInformation[socket.id].heldFoodId = foodId

          this.food[this.playerGameInformation[socket.id].heldFoodId].posX =  this.playerGameInformation[socket.id].posX
          this.food[this.playerGameInformation[socket.id].heldFoodId].posY =  this.playerGameInformation[socket.id].posY +25
          this.food[this.playerGameInformation[socket.id].heldFoodId].state = 1
          io.emit("foodUpdate", foodId,this.food[this.playerGameInformation[socket.id].heldFoodId].posX,this.food[this.playerGameInformation[socket.id].heldFoodId].posY )
        }
        else{
          console.log("wrong")
          socket.emit("qResponse", false), 
          socket.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", `Sorry but ${letValue[this.questions[qID].ans]} was the correct answer. You will wait here for five seconds to think about your wrong doings` )
        }
      })
      socket.on("sendMessage", (message) =>
      {
        //check for commands here
        
        if(message.trim()[0] == "/")
        {
          console.log("command")
          if(!this.playerManager.PlayerData[socket.id].admin)
          {
            socket.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", "You are not an admin" )
            return;
          }
          if(message.trim()=="/start")
          {
            if(this.gamestate == 1)
            {
              socket.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", "Game Has Already Started" )
              return; 
            }
            this.gamestate=1;
            socket.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", "Starting Game" )
            this.StartGame();
          }
          else
          {
            
            socket.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", `Unknown Command ${message.trim()}` )
          }
        }
        else
        {
          socket.broadcast.emit("renderMessage", this.playerGameInformation[socket.id].username,message)
        }
      })

      socket.on("playerInput", (keys) =>
      {
        this.Movement(keys,socket.id,socket)
        
        socket.broadcast.emit("playerInput",socket.id,this.playerGameInformation[socket.id].posX,this.playerGameInformation[socket.id].posY)
        socket.emit("localPlayerMovement",this.playerGameInformation[socket.id].posX,this.playerGameInformation[socket.id].posY)
      })

      socket.on("disconnect", ()=>
      {
        socket.broadcast.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", `${this.playerGameInformation[socket.id].username} has left!` )
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
    this.feederSpawn = {}; 
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
    this.feederSpawn = 
    {
      posX: this.xCount*this.obSize/2,
      posY: ((this.map.length/this.xCount) * this.obSize)/2,
      radius: 200
    }
    this.food[0] = {
      posX: this.xCount*this.obSize/2,
      posY: ((this.map.length/this.xCount) * this.obSize)/2,
      radius: 30,
      state: 0,
      //0 means ready to be grabbed and will prompt,
      //1 means being carried
    }
    this.food[1] = {
      posX: this.xCount*this.obSize/2+50,
      posY: ((this.map.length/this.xCount) * this.obSize)/2,
      radius: 30,
      state: 0,
      //0 means ready to be grabbed and will prompt,
      //1 means being carried
    }
    console.log(this.teamSpawns)
  }
  StartGame()
  {
    this.gameTimer = this.timeLength; 
    
    // this.currentGameJob = new this.bree(
    //   {
    //     jobs:[
    //       {
    //         name:"GameTimer",
    //         interval: "1s",
    //       }
    //     ],
    //     workerMessageHandler: ()=>
    //     {
    //       this.gameTimer -= 1;
    //     }

    //   }
    // )
    this.teamData = 
    {
      0:{
        points:0
      },
      1:{
        points:0
      },
      2:{
        points:0
      },
      3:{
        points:0
      }
    }
    for(let i = 0; i < Object.keys(this.playerGameInformation).length; i++)
    {
      this.playerGameInformation[Object.keys(this.playerGameInformation)[i]].posX = this.teamSpawns[ this.playerGameInformation[Object.keys(this.playerGameInformation)[i]].teamId].posX +(Math.random()*this.teamSpawns[this.playerGameInformation[Object.keys(this.playerGameInformation)[i]].teamId].radSpawn) *(Math.random()*2-1)
      this.playerGameInformation[Object.keys(this.playerGameInformation)[i]].posY = this.teamSpawns[ this.playerGameInformation[Object.keys(this.playerGameInformation)[i]].teamId].posY +(Math.random()*this.teamSpawns[this.playerGameInformation[Object.keys(this.playerGameInformation)[i]].teamId].radSpawn) *(Math.random()*2-1)
      const id = Object.keys(this.playerGameInformation)[i]
      this.io.emit("playerInput",id,this.playerGameInformation[id].posX,this.playerGameInformation[id].posY)
    }
    this.io.emit("startGame",(this.gameTimer))
    return [this.gameTimer,]
  }
  Movement(keys,id,socket)
  {
    // let tempX = this.playerGameInformation[socket.id].posX;
    // let tempY = this.playerGameInformation[socket.id].posY;
    
    const playerInfo = this.playerGameInformation[id];
    if(keys[5])
    {
      //cehck for collison 
      for(let i in this.food)
      {
        console.log(i)
        const food = this.food[i]
        if(Math.sqrt((food.posX - playerInfo.posX)**2 +(food.posX - playerInfo.posX)**2) < food.radius && food.state == 0)
        {
          console.log("collide")
          let qID = Math.floor(Math.random()*Object.keys(this.questions).length)
          socket.emit("promptQuestion", this.questions[qID].prompt, qID, i );
          return; 
        }
        
      }
      console.log("not colliding")
    }
    
    let width = 20;
    //w
    let curSpeed = this.speed;
    if(keys[4])
    {
      curSpeed *= 1.5;
    } 
    if(keys[0])
    {

      let tempY = playerInfo.posY+ curSpeed;
      if(this.map[Math.floor((tempY+width*2)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-5)/this.obSize)] != 1 &&this.map[Math.floor((tempY+width*2)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-10)/this.obSize)] != 1&&this.map[Math.floor((tempY+width)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-20)/this.obSize)] != 1)
      {
        playerInfo.posY = tempY
      }
    }
    //s
    if(keys[1])
    {
      let tempY = playerInfo.posY- curSpeed;
      if(this.map[Math.floor((tempY+width)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-5)/this.obSize)] != 1&&this.map[Math.floor((tempY+width)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-10)/this.obSize)] != 1&&this.map[Math.floor((tempY+width)/this.obSize)*this.xCount + Math.floor((playerInfo.posX+width*2-20)/this.obSize)] != 1)
      {
        playerInfo.posY = tempY
      }
    }
    //a
    if(keys[2])
    {
      let tempX = playerInfo.posX+ curSpeed;
      if(this.map[Math.floor((playerInfo.posY+width)/this.obSize)*this.xCount + Math.floor((tempX+width*2)/this.obSize)] != 1&&this.map[Math.floor((playerInfo.posY+width+10)/this.obSize)*this.xCount + Math.floor((tempX+width*2)/this.obSize)] != 1&&this.map[Math.floor((playerInfo.posY+width+15)/this.obSize)*this.xCount + Math.floor((tempX+width*2)/this.obSize)] != 1)
      {
        playerInfo.posX = tempX
      }
    }
    //d
    if(keys[3])
    {
      let tempX = playerInfo.posX- curSpeed;
      if(this.map[Math.floor((playerInfo.posY+width)/this.obSize)*this.xCount + Math.floor((tempX+width)/this.obSize)] != 1&&this.map[Math.floor((playerInfo.posY+width+5)/this.obSize)*this.xCount + Math.floor((tempX+width)/this.obSize)] != 1&&this.map[Math.floor((playerInfo.posY+width+15)/this.obSize)*this.xCount + Math.floor((tempX+width*2)/this.obSize)] != 1)
      {
        playerInfo.posX = tempX
      }
    }
    if(playerInfo.heldFoodId > -1)
    {
      this.food[playerInfo.heldFoodId].posX =  playerInfo.posX
      this.food[playerInfo.heldFoodId].posY =  playerInfo.posY +25
      this.io.emit("foodUpdate", playerInfo.heldFoodId,this.food[playerInfo.heldFoodId].posX,this.food[playerInfo.heldFoodId].posY )
    }
   

  }

  CreatePlayer(_id, _teamId,_username)
  {
    
    const data = 
    {
      posX: this.teamSpawns[_teamId].posX +(Math.random()*this.teamSpawns[_teamId].radSpawn) *(Math.random()*2-1),
      posY: this.teamSpawns[_teamId].posY +(Math.random()*this.teamSpawns[_teamId].radSpawn)*(Math.random()*2-1),
      teamId: _teamId,
      username: _username,
      heldFoodId:-1
    }
    this.playerGameInformation[_id] = data
    return data; 

  }


}