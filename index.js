if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require(`express`);
const app = express();
const socketio = require(`socket.io`);
const http = require(`http`)
const server = http.createServer(app)
const io = socketio(server)
const path = require(`path`)
const cookieParser = require("cookie-parser");

const playerManager = require(`./PlayerManager.js`)
const gameManager = require(`./GameManager.js`)
const map = require("./MAP.js")

app.use(cookieParser());
const PlayerManager = new playerManager();
const GameManager = new gameManager(io, PlayerManager,map)

app.use(express.json())
app.use(express.urlencoded({
    extended:false
}));
app.use(`/`, express.static(path.join(__dirname, `public`, `home`)))
app.use("/",require("./router/routes"))
app.use("/ingame", (req,res,next) =>
{
  const name = req.cookies.usernameSet;
  if(!name)
  {
    res.redirect("/")
    return;
  }
  if(name.replace(/\s/g, '') == '')
  {
    res.redirect("/")
    return;
  }
  
  next(); 

}, express.static(path.join(__dirname,"public", "game")))

server.listen(process.env.PORT, console.log(`Server up`))
// playerManager.PlayerConnect(`jwwqs`,`swag`)

// playerManager.PlayerDisconnect(`jwwqs`)
