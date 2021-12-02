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
    this.timeLength = 300 //300
    this.food ={}; 
    this.passwordAdmin = "wasGWEg3b9IDBFis"
    //A = 0, B = 1, C = 2, D = 3
    this.questions = require("./Questions")

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
        food: this.food,
        teamData: this.teamData,
        timer: this.gameTimer,
        gameState: this.gamestate
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
          if(this.food[this.playerGameInformation[socket.id].heldFoodId]) return; 
          if(!this.food)
          {
            return; //Need to run in and put checks on this.food stuff
          }
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
            let messageSplit = message.split(" ");
            if(messageSplit[0]=="/admin" && messageSplit[1] == this.passwordAdmin)
            {
              for(let i in this.playerManager.PlayerData)
              {
                this.playerManager.PlayerData[i].admin = false; 
              }
              socket.emit("renderMessage", "<span style='color:#db46e8'>Server</span>", "You are now elevated as admin!" )
              this.playerManager.PlayerData[socket.id].admin = true;

              return;
            }
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
    this.iterate = 0;
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
    
    
    console.log(this.teamSpawns)
  }
  StartGame()
  {
    this.gameTimer = this.timeLength; 
    
    this.currentGameJob = new this.bree(
      {
        jobs:[
          {
            name:"GameTimer",
            interval: "1s",
          }
        ],
        workerMessageHandler: (name,args)=>
        {
          this.gameTimer -= 1;
          console.log(this.gameTimer )
          if(this.gameTimer == 0)
          {
            let hi = 0; 
            for(let i in this.teamData)
            {
              if(this.teamData[i].points > hi) hi = this.teamData[i].points
            }
            let victoryRoyale = "";
            let first = true; 
            let teamAnnouce = "Team"
            for(let i in this.teamData)
            {
              if(this.teamData[i].points == hi) 
              {
                if(first)
                {
                  victoryRoyale += `${this.playerManager.TeamData[i].name}`
                  first = false;
                } 
                else 
                {
                  teamAnnouce = "Teams"
                  victoryRoyale += `, ${this.playerManager.TeamData[i].name}`
                }
                
              }
              
            } 
            this.food = {};
            
            this.io.emit("renderMessage", "<span style='color:#db46e8'>Server (to all)</span>", `GAME OVER!`)
            this.io.emit("renderMessage", "<span style='color:#db46e8'>Server (to all)</span>", `${teamAnnouce}: ${victoryRoyale} has won!`)
            
            this.currentGameJob.stop();
            this.currentGameJob = undefined;
            this.gamestate = 0; 
            this.io.emit("resetGame")
            return;
          }
          
          this.iterate++;
          //this could be really unbalanced
          // if(this.iterate == 30 )
          // {

          // }
          if(this.iterate == 5)
          {
            if(Object.keys(this.food).length <6)
            {
              const newFood ={
                posX: this.xCount*this.obSize/2 + 60*(Math.random()*2 -1),
                posY: ((this.map.length/this.xCount) * this.obSize)/2+ 60*(Math.random()*2 -1),
                radius: 30,
                state: 0,
                symbol: Math.floor(Math.random()*7)
                //0 means ready to be grabbed and will prompt,
                //1 means being carried
              }
              console.log(Object.keys(this.food))
              let foodId = 0
              if(Object.keys(this.food).length > 0)
              {
                foodId = parseInt(Object.keys(this.food)[Object.keys(this.food).length-1]) +1;
              }
              
              // const foodId = 1
              this.food[foodId] = newFood
              console.log(this.food)
              this.io.emit("spawnFood", newFood,foodId)
            }
            this.iterate = 0;
          }
        }

      }
    )
    this.currentGameJob.start()
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
  }
  Movement(keys,id,socket)
  {
    // let tempX = this.playerGameInformation[socket.id].posX;
    // let tempY = this.playerGameInformation[socket.id].posY;
    
    const playerInfo = this.playerGameInformation[id];
    if(keys[5] )
    {
      if(playerInfo.heldFoodId <0)
      {
        for(let i in this.food)
        {
          const food = this.food[i]
          if(Math.sqrt((food.posX - playerInfo.posX)**2 +(food.posY - playerInfo.posY)**2) < food.radius && food.state == 0)
          {
            console.log(Object.keys(this.questions).length)
            let qID = Math.floor(Math.random()*Object.keys(this.questions).length)
            socket.emit("promptQuestion", this.questions[qID].prompt, qID, i );
            return; 
          }
          
        }
      }
      else
      {
        const teamId = playerInfo.teamId
        if(Math.sqrt((playerInfo.posX - this.teamSpawns[teamId].posX)**2 +(playerInfo.posY - this.teamSpawns[teamId].posY)**2) < 70 )
        {
          this.teamData[teamId].points += 1;
          this.io.emit("renderMessage", "<span style='color:#db46e8'>Server (to all)</span>", `${this.playerGameInformation[id].username} has scored a point for team ${this.playerManager.TeamData[teamId].name}!`)
          this.io.emit("removeFood",playerInfo.heldFoodId )
          this.io.emit("teamPointUpdates", teamId,this.teamData[teamId].points)
          delete this.food[playerInfo.heldFoodId] 
          this.playerGameInformation[id].heldFoodId = -1;
          
        }
          
        
        console.log("not colliding with hill")
      }
      //cehck for collison 
      
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
    if(playerInfo.heldFoodId > -1&&this.food[playerInfo.heldFoodId])
    {
      this.food[playerInfo.heldFoodId].posX =  playerInfo.posX
      this.food[playerInfo.heldFoodId].posY =  playerInfo.posY +25
      
      
      if(this.food[playerInfo.heldFoodId]) this.io.emit("foodUpdate", playerInfo.heldFoodId,this.food[playerInfo.heldFoodId].posX,this.food[playerInfo.heldFoodId].posY )
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