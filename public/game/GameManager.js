

const socket = io();




var windowH = window.innerHeight*0.95
var windowW = window.innerWidth*0.7
var rad = 10;

var xColors = [[255,0,0],[0,0,255],[214, 116, 211], [52,155,7],[221,205,13]]

const speed = 5;

let gameState = 0; 

let bg;

let obstacles = [];
let backgrounds = [];
let props = [];
let mainPlayer;
const clients = {};

var MAP; 

const colorArray = [[133, 31, 24], [20, 24, 120], [179, 159, 29], [31, 173, 79]]

const playerColorArray = [[138, 40, 24], [30, 20, 110], [169, 145, 39], [26, 183, 69]]

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
    console.log(Object.keys(data.playerData))
    for(let i = 0; i < Object.keys(data.playerData).length; i++)
    {
        if(Object.keys(data.playerData)[i] == socket.id)
        {
            console.log(data.playerData[Object.keys(data.playerData)[i]].teamId)
            clients[Object.keys(data.playerData)[i]] = new MainPlayer(data.playerData[Object.keys(data.playerData)[i]].posX, data.playerData[Object.keys(data.playerData)[i]].posY,playerColorArray[data.playerData[Object.keys(data.playerData)[i]].teamId],data.playerData[Object.keys(data.playerData)[i]].username);
            mainPlayer = clients[Object.keys(data.playerData)[i]];
        }
        else 
        {
            
            console.log(Object.keys(data.playerData)[i])
            clients[Object.keys(data.playerData)[i]] = new Players(data.playerData[Object.keys(data.playerData)[i]].posX, data.playerData[Object.keys(data.playerData)[i]].posY, playerColorArray[data.playerData[Object.keys(data.playerData)[i]].teamId],data.playerData[Object.keys(data.playerData)[i]].username);
        }
    }
    console.log("coming")
    console.log(clients)
    CreateMap()
    gameState = 1;
})

socket.on("localPlayerMovement", (x, y) =>
{
    mainPlayer.x = x;
    mainPlayer.y = y;
})

socket.on("newPlayerConnection", (id,x,y,teamId,username) =>
{
    clients[id] = new Players(x,y, playerColorArray[teamId],username)
})

socket.on("playerInput", (id,x, y) =>
{
    clients[id].x = x; 
    clients[id].y = y;
    console.log(id)
})

socket.on("playerDisconnect", (id) =>
{
    delete clients[id]
})

window.onresize = () =>{
    
    windowH = window.innerHeight*0.95
    windowW = window.innerWidth*0.7
    resizeCanvas(windowW, windowH);
    if(mainPlayer)
    {
        
    mainPlayer.displayX = windowW/2
    mainPlayer.displayY = windowH/2
    }
}

class MainPlayer
{
    constructor(x, y, color,username)
    {
        this.displayX = windowW/2
        this.displayY = windowH/2
        this.x = x; 
        this.y = y;
        this.color = color; 
        this.width = 20;
        this.username = username
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


class Players
{
    constructor(x,y, color,username)
    {
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = 20
        this.username = username
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


function setup()
{
    textAlign(CENTER, CENTER);
    bg = loadImage("assets/backgroundImage.gif")
    frameRate(60)
    createCanvas(windowW, windowH);
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
    const keys = [keyIsDown(87),keyIsDown(83),keyIsDown(65),keyIsDown(68)];
    if(keys.includes(true))
    {
        socket.emit("playerInput", keys, socket.id)
    
    }
    width = 20
    if(keys[0])
    {
      let tempY = mainPlayer.y+ speed;
      if(MAP[Math.floor((tempY+width*2)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-5)/obSize)] != 1 &&MAP[Math.floor((tempY+width*2)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-10)/obSize)] != 1&&MAP[Math.floor((tempY+width)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-20)/obSize)] != 1)
      {
        mainPlayer.y = tempY
      }
    }
    //s
    if(keys[1])
    {
      let tempY = mainPlayer.y- speed;
      if(MAP[Math.floor((tempY+width)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-5)/obSize)] != 1&&MAP[Math.floor((tempY+width)/obSize)*xCount + Math.floor((mainPlayer.posX+width*2-10)/obSize)] != 1&&MAP[Math.floor((tempY+width)/obSize)*xCount + Math.floor((mainPlayer.x+width*2-20)/obSize)] != 1)
      {
        mainPlayer.y = tempY
      }
    }
    //a
    if(keys[2])
    {
      let tempX = mainPlayer.x+ speed;
      if(MAP[Math.floor((mainPlayer.y+width)/obSize)*xCount + Math.floor((tempX+width*2)/obSize)] != 1&&MAP[Math.floor((mainPlayer.y+width+10)/obSize)*xCount + Math.floor((tempX+width*2)/obSize)] != 1&&MAP[Math.floor((mainPlayer.y+width+15)/obSize)*xCount + Math.floor((tempX+width*2)/obSize)] != 1)
      {
        mainPlayer.x = tempX
      }
    }
    //d
    if(keys[3])
    {
      let tempX = mainPlayer.x- speed;
      if(MAP[Math.floor((mainPlayer.y+width)/obSize)*xCount + Math.floor((tempX+width)/obSize)] != 1&&MAP[Math.floor((mainPlayer.y+width+5)/obSize)*xCount + Math.floor((tempX+width)/obSize)] != 1&&MAP[Math.floor((mainPlayer.y+width+15)/obSize)*xCount + Math.floor((tempX+width*2)/obSize)] != 1)
      {
        mainPlayer.x = tempX
      }
    }
    document.getElementById("locationCoord").innerHTML = `(${mainPlayer.x}, ${mainPlayer.y})`
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
