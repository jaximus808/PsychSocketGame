

const socket = io();

var windowH = window.innerHeight*0.95
var windowW = window.innerWidth*0.6
var rad = 10;

var xColors = [[255,0,0],[0,0,255],[214, 116, 211], [52,155,7],[221,205,13]]
var teamName = ["Red","Blue","Yellow", "Green"]

const speed = 5;

let gameState = 0; 

let bg;

let timerCurrent = 0; 

let timerOb;

let inputState = true; 

let obstacles = [];
let backgrounds = [];
let props = [];
let mainPlayer;
const clients = {};
let food = {};
let currentQuestionId; 
let promptFoodId; 
var MAP; 
let foodSymbols = ["🍕","🌭","🍗","🥞","🍣","🍞","🍙"]

const colorArray = [[133, 31, 24], [20, 24, 120], [179, 159, 29], [31, 173, 79]]

const playerColorArray = [[138, 40, 24], [30, 20, 110], [169, 145, 39], [26, 183, 69]]

var prompted = false;
var obSize = 64;
var xCount;
var yCount = 34

socket.on("test",(message) =>
{
  document.getElementById("test").innerHTML = message
  })


socket.on("redirectHome", ()=>
{
    window.location.href = "/"
})

socket.on("GameInformation", (data) =>
{
    data = JSON.parse(data);
    console.log(data)
    MAP = data.map
    //send this from server later
    xCount = MAP.length/34; 
    // mainPlayer = new MainPlayer(data.localPlayerData.posX, data.localPlayerData.posY,5);
    client = {}  
    console.log(Object.keys(data.playerData))
    document.getElementById("playersCount").innerHTML = `Players: ${Object.keys(data.playerData).length}`
    for(let i = 0; i < Object.keys(data.playerData).length; i++)
    {
        if(Object.keys(data.playerData)[i] == socket.id)
        {
            console.log(data.playerData[Object.keys(data.playerData)[i]].teamId)
            clients[Object.keys(data.playerData)[i]] = new MainPlayer(data.playerData[Object.keys(data.playerData)[i]].posX, data.playerData[Object.keys(data.playerData)[i]].posY,playerColorArray[data.playerData[Object.keys(data.playerData)[i]].teamId],data.playerData[Object.keys(data.playerData)[i]].username,data.playerData[Object.keys(data.playerData)[i]].teamId);
            mainPlayer = clients[Object.keys(data.playerData)[i]];
        }
        else 
        {
            
            console.log(Object.keys(data.playerData)[i])
            clients[Object.keys(data.playerData)[i]] = new Players(data.playerData[Object.keys(data.playerData)[i]].posX, data.playerData[Object.keys(data.playerData)[i]].posY, playerColorArray[data.playerData[Object.keys(data.playerData)[i]].teamId],data.playerData[Object.keys(data.playerData)[i]].username,data.playerData[Object.keys(data.playerData)[i]].teamId);
        }
    }
    props.push(new Feeder(data.feederInfo.posX,data.feederInfo.posY,data.feederInfo.radius))
    for(let i in data.food)
    {
        food[i]= new Food( data.food[i].posX, data.food[i].posY,foodSymbols[data.food[i].symbol],i, data.food[i].radius);
    }
    document.getElementById("Timer").innerHTML = "Time Left: " + data.timer ;
    if(gameState == 1)
    {
        document.getElementById("Gamestate").innerHTML = "Game in Progress"
    }
    for(let i in data.teamData)
    {
        console.log(i)
        document.getElementById(`team${parseInt(i)+1}Points`).innerHTML = `${teamName[i]} Points: ${data.teamData[i].points}`
    }
    DisplayCurrentTeams()
    console.log(clients)
    CreateMap()
    gameState = 1;
})

socket.on("teamPointUpdates",(id, points)=>
{
    document.getElementById(`team${parseInt(id)+1}Points`).innerHTML = `${teamName[id]} Points: ${points}`
})

socket.on("localPlayerMovement", (x, y) =>
{
    mainPlayer.x = x;
    mainPlayer.y = y;
})

socket.on("promptQuestion" ,(prompt, id, foodId ) =>
{
    prompted = true; 
    promptFoodId = foodId;
    currentQuestionId = id;
    document.getElementById("QuestionPrompt").innerHTML = prompt;
    document.getElementById("questionContianer").style.display = "inline"
})

socket.on("startGame",(_timer) =>
{
    timerCurrent = _timer;
    document.getElementById("Timer").innerHTML = `Time Left: ${_timer} seconds`; 
    timerOb = setInterval(() =>
    {
        timerCurrent -= 1;
        document.getElementById("Timer").innerHTML = `Time Left: ${timerCurrent} seconds `; 
    }, 1000)
    
    document.getElementById("Gamestate").innerHTML = "Game is in Progress"
})

socket.on("renderMessage",(username,message)=>
{
    RenderMessage(username,message)
})

socket.on("newPlayerConnection", (id,x,y,teamId,username) =>
{
    clients[id] = new Players(x,y, playerColorArray[teamId],username,teamId)
    document.getElementById("playersCount").innerHTML = `Players: ${Object.keys(clients).length}`
    DisplayCurrentTeams()
})

socket.on("playerInput", (id,x, y) =>
{
    clients[id].x = x; 
    clients[id].y = y;
    console.log(id)
})

socket.on("foodUpdate" ,(id,x,y) =>
{
    food[id].x = x;
    food[id].y = y
})
socket.on("resetGame", ()=>
{
    document.getElementById("Gamestate").innerHTML = "Game is waiting for host to start";
    prompted = false; 
    food = {};
    clearInterval(timerOb)
    document.getElementById("Timer").innerHTML = "Time Left:";
})

socket.on("qResponse", (pass) =>
{
    document.getElementById("questionContianer").style.display = "none"
    if(pass)
    {
        prompted = false; 
    }
    else 
    {
        setTimeout(() =>{prompted = false}, 5000)
    }
})

socket.on("spawnFood",(foodData,foodId) =>
{
    food[foodId]= new Food( foodData.posX, foodData.posY,foodSymbols[foodData.symbol],foodId, foodData.radius);
})

socket.on("removeFood",(id) =>
{
    delete food[id]
})

socket.on("playerDisconnect", (id) =>
{
    delete clients[id]
    DisplayCurrentTeams()
    document.getElementById("playersCount").innerHTML = `Players: ${Object.keys(clients).length}`
})


window.onresize = () =>{
    
    windowH = window.innerHeight*0.95
    windowW = window.innerWidth*0.7
    var chatContainer = document.getElementById("chatArea");
    chatContainer.style.left = `${window.innerWidth /2 +windowW/2 - chatContainer.offsetWidth  }px`
    
    chatContainer.style.top = `${window.innerHeight /2 +windowH/2 - chatContainer.offsetHeight  }px`
    resizeCanvas(windowW, windowH);
    if(mainPlayer)
    {
        
    mainPlayer.displayX = windowW/2
    mainPlayer.displayY = windowH/2
    }
}

document.getElementById("inp").addEventListener("focus", (event) =>
{
    inputState = false;
})
document.getElementById("inp").addEventListener('blur', (event) => {
    inputState = true; 
});

function RenderMessage(username,message)
{
    var chatContainer = document.getElementById("chatContianer");
    var chatP = document.createElement("p");
    chatP.setAttribute("class", "message");
    chatP.innerHTML =`${username}: ${message}` ;
    chatContainer.prepend(chatP)
}



function SendMessageDOM()
{
    const message = document.getElementsByClassName("inputMessage")[0].value;
    if(!message.trim()) return;
    document.getElementsByClassName("inputMessage")[0].value = "";
    socket.emit("sendMessage",message )
    RenderMessage(
        mainPlayer.username,
        message);
    
}

function DisplayCurrentTeams()
{
  let playerString = "Team Memebers:";
  let i = 1;
  for(const i in clients)
  {
    if(clients[i].teamId == mainPlayer.teamId)
    {
      playerString += `<br>${i}. ${clients[i].username}`
      i++
    }
  }
  document.getElementById("teamMembers").innerHTML = playerString
}


function ansA()
{
    socket.emit("answer", 0, currentQuestionId,promptFoodId)
}

function ansB()
{
    
    socket.emit("answer", 1, currentQuestionId,promptFoodId)
}
function ansC()
{
    socket.emit("answer", 2, currentQuestionId,promptFoodId)
    
}
function ansD()
{
    socket.emit("answer", 3, currentQuestionId,promptFoodId)
    
}

class MainPlayer
{
    constructor(x, y, color,username,teamId)
    {
        this.displayX = windowW/2
        this.displayY = windowH/2
        this.x = x; 
        this.y = y;
        this.color = color; 
        this.width = 20;
        this.username = username
        this.teamId = teamId
    }

    RenderOb()
    {
        fill(color(this.color[0],this.color[1],this.color[2]))
        rect(this.displayX, this.displayY,20,20)
        textSize(16)
        fill(0,0,0)
        text("You",this.displayX ,this.displayY-this.width/2-20 )
    }
}

class Food
{
    constructor(x,y, symbol, id,rad)
    {
        this.x = x; 
        this.y = y; 
        this.symbol = symbol;
        this.id = id; 
        this.rad = rad
        this.color = [5,5,5]
    }

    RenderOb(pX,pY)
    {
        fill(94,94,94,150)
        circle(windowW/2+(pX -this.x) ,windowH/2+(pY -this.y),this.rad)
        textSize(24)
        text(this.symbol,windowW/2+(pX -this.x) ,windowH/2+(pY -this.y))
    }
}
class Feeder
{
    constructor(x, y, radius)
    {
        this.x = x;
        this.y = y;
        this.iter1 = 0;
        this.iter2 = 50;
        this.iter3 = 100;
        this.rad = radius;
        this.color = [this.iter1,this.iter2,this.iter3]
    }

    RenderOb(pX,pY)
    {
        
        fill(this.iter1,this.iter2,this.iter3)
        this.color = [this.iter1,this.iter2,this.iter3]
        if(this.iter1 == 255)
        {
            this.iter1 = 0;
        }
        else 
        {
            this.iter1 += 1;
        }
        if(this.iter2 == 255)
        {
            this.iter2 = 0;
        }
        else 
        {
            this.iter2 += 1;
        }if(this.iter3 == 255)
        {
            this.iter3 = 0;
        }
        else 
        {
            this.iter3 += 1;
        }
        circle(windowW/2+(pX -this.x) ,windowH/2+(pY -this.y),this.rad)
    }
}

class Players
{
    constructor(x,y, color,username,teamId)
    {
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = 20
        this.username = username
        this.teamId = teamId
    }
    RenderOb(pX, pY)
    {
        fill(color(this.color[0],this.color[1],this.color[2]))
        //console.log(pX)
        rect(windowW/2+(pX -this.x) ,windowH/2+(pY -this.y),this.width,this.width )
        textSize(16)
        fill(0,0,0)
        text(this.username,windowW/2+(pX -this.x) ,windowH/2+(pY -this.y-this.width-20) )
    }
}


class Obstacle
{
    constructor(x, y, color, width)
    {
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = width
    }

    RenderOb(pX, pY)
    {
        fill(color(255,0,0))
        //console.log(pX)
        rect(windowW/2+(pX -this.x) ,windowH/2+(pY -this.y),this.width,this.width )
    }
}

class HillArea
{
    constructor(x,y, color, radius)
    {
        this.x = x;
        this.y = y;
        this.color = color;
        this.rad = radius
    }

    RenderOb(pX, pY)
    {
        fill(color(this.color[0],this.color[1],this.color[2]))
        //console.log(pX)
        circle(windowW/2+(pX -this.x) ,windowH/2+(pY -this.y),this.rad)
    }
}

class Background
{
    constructor(x, y, color, width)
    {
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = width
    }

    RenderOb(pX, pY)
    {
        fill(color(this.color[0],this.color[1],this.color[2]))
        //console.log(pX)
        rect(windowW/2+(pX -this.x) ,windowH/2+(pY -this.y),this.width,this.width )
    }
}

function createMiniMap()
{
  let margin = 20; 
  let mapSizeBlock = 5;
  
  for(let y = 0; y < yCount; y++)
  {
    for(let x = 0; x < xCount; x++)
    {
      if(MAP[y*xCount + x] == 1)
      {
        stroke(2);
        fill(color(255,0,0))
        rect(margin +mapSizeBlock*xCount- mapSizeBlock*x, margin+mapSizeBlock*yCount- mapSizeBlock*y, mapSizeBlock+0.1,mapSizeBlock+0.1);
      }
      else
      {
        noStroke()
        fill(color(255,255,255))
        rect(margin +mapSizeBlock*xCount- mapSizeBlock*x, margin+mapSizeBlock*yCount-mapSizeBlock*y, mapSizeBlock+1,mapSizeBlock+1);
      }
    }
  }

  for(let i in props)
  {
    noStroke();
    const curProps = props[i]
    fill(color(curProps.color[0],curProps.color[1],curProps.color[2]))
    circle(margin + (xCount*obSize-curProps.x)/13,margin+(yCount*obSize-curProps.y)/13,curProps.rad/13)
  }

  for(let i in clients)
  {
    stroke(2);
    const curClient = clients[i]
    fill(color(curClient.color[0],curClient.color[1],curClient.color[2]))
    circle(margin + (xCount*obSize-curClient.x)/13,margin+(yCount*obSize-curClient.y)/13,4)
  }
}


function setup()
{
    textAlign(CENTER, CENTER);
    bg = loadImage("assets/backgroundImage.gif")
    frameRate(60)
    createCanvas(windowW, windowH);
    var chatContainer = document.getElementById("chatArea");
    chatContainer.style.left = `${window.innerWidth /2 +windowW/2 - chatContainer.offsetWidth -10 }px`
    
    chatContainer.style.top = `${window.innerHeight /2 +windowH/2 - chatContainer.offsetHeight -10 }px`
    canvOb = document.getElementById("defaultCanvas0")
    rectMode(CENTER)
   
}


function draw()
{
    if(gameState == 0) return; 

    clear();
    background(bg)
    //console.log(mainPlayer.x)
    noStroke()
    for(let i = 0; i < backgrounds.length; i++)
    {
        backgrounds[i].RenderOb(mainPlayer.x, mainPlayer.y);
    }
    for(let i = 0; i < props.length; i++)
    {
        props[i].RenderOb(mainPlayer.x, mainPlayer.y);
    }
    for(let i = 0; i < obstacles.length; i++)
    {
        obstacles[i].RenderOb(mainPlayer.x, mainPlayer.y);
    }
    stroke(1)
    mainPlayer.RenderOb();
    for(let i = 0; i < Object.keys(clients).length; i++)
    {
        if(Object.keys(clients)[i] != socket.id)
        {
            clients[Object.keys(clients)[i]].RenderOb(mainPlayer.x, mainPlayer.y);
        }
    }
    for(let i = 0; i < Object.keys(food).length; i++)
    {
        food[Object.keys(food)[i]].RenderOb(mainPlayer.x, mainPlayer.y);
        
    }
    if(inputState && !prompted)
    {
        const keys = [keyIsDown(87),keyIsDown(83),keyIsDown(65),keyIsDown(68),keyIsDown(16),keyIsDown(32)];
        if(keys.includes(true))
        {
            socket.emit("playerInput", keys, socket.id)
        
        }
        width = 20
        
        let curSpeed = speed;
        //lmao k
        // if(keys[0])
        // {
        //     if(keyIsDown(16)) curSpeed*=2;
        //     let tempY = mainPlayer.y+ deltaTime/curSpeed;
        //     if(MAP[Math.floor((tempY+width*2)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-5)/obSize)] != 1 &&MAP[Math.floor((tempY+width*2)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-10)/obSize)] != 1&&MAP[Math.floor((tempY+width)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-20)/obSize)] != 1)
        //     {
        //         mainPlayer.y = tempY
        //     }
        // }
        // //s
        // if(keys[1])
        // {
        //   let tempY = mainPlayer.y- deltaTime/curSpeed;
        //   if(MAP[Math.floor((tempY+width)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-5)/obSize)] != 1&&MAP[Math.floor((tempY+width)/obSize)*xCount + Math.floor((mainPlayer.posX+width*2-10)/obSize)] != 1&&MAP[Math.floor((tempY+width)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-20)/obSize)] != 1)
        //   {
        //     mainPlayer.y = tempY
        //   }
        // }
        // //a
        // if(keys[2])
        // {
        //   let tempX = mainPlayer.x+deltaTime/ curSpeed;
        //   if(MAP[Math.floor((mainPlayer.y+width)/obSize)*xCount + Math.floor((tempX+width*2)/obSize)] != 1&&MAP[Math.floor((mainPlayer.y+width+10)/obSize)*xCount + Math.floor((tempX+width*2)/obSize)] != 1&&MAP[Math.floor((mainPlayer.y+width+15)/obSize)*xCount + Math.floor((tempX+width*2)/obSize)] != 1)
        //   {
        //     mainPlayer.x = tempX
        //   }
        // }
        // //d
        // if(keys[3])
        // {
        //   let tempX = mainPlayer.x-deltaTime/ curSpeed;
        //   if(MAP[Math.floor((mainPlayer.y+width)/obSize)*xCount + Math.floor((tempX+width)/obSize)] != 1&&MAP[Math.floor((mainPlayer.y+width+5)/obSize)*xCount + Math.floor((tempX+width)/obSize)] != 1&&MAP[Math.floor((mainPlayer.y+width+15)/obSize)*xCount + Math.floor((tempX+width*2)/obSize)] != 1)
        //   {
        //     mainPlayer.x = tempX
        //   }
        // }
    }
    else 
    {
        if(keyIsDown(13))
        {
            document.activeElement.blur();
            SendMessageDOM();
        }
    }
    createMiniMap()
    document.getElementById("locationCoord").innerHTML = `Position: \n(${Math.floor(mainPlayer.x)}, ${Math.floor(mainPlayer.y)})`
}

function CreateMap()
{
    console.log(MAP.length)
    for(let i = 0; i < MAP.length; i++)
    {
        //console.log((MAP[i]))
        if(MAP[i] == 1)
        {
            obstacles.push(new Obstacle((i-Math.floor(i/xCount)*xCount) * obSize  ,Math.floor(i/xCount) *obSize,5, obSize+1  ))
        }
        else if(MAP[i] < 0)
        {
            props.push(new HillArea((i-Math.floor(i/xCount)*xCount) * obSize  ,Math.floor(i/xCount) *obSize, colorArray[MAP[i]*-1-1], 120))
            //backgrounds.push(new Background((i-Math.floor(i/xCount)*xCount) * obSize  ,Math.floor(i/xCount) *obSize,[255-(25*(i%2)),255-(25*(i%2)),255-(25*(i%2))], obSize+1 ))
        }
        else if(MAP[i]==0)
        {
            backgrounds.push(new Background((i-Math.floor(i/xCount)*xCount) * obSize  ,Math.floor(i/xCount) *obSize,[255-(25*(i%2)),255-(25*(i%2)),255-(25*(i%2))], obSize+1 ))
        }
    }
}
