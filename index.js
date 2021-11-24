const express = require(`express`);
const app = express();
const socketio = require(`socket.io`);
const http = require(`http`)
const server = http.createServer(app)
const io = socketio(server)
const path = require(`path`)

const PlayerManager = require(`./PlayerManager.js`)

const playerManager = new PlayerManager();

require(`./sockets/socketcom`)(io)

app.use(express.json())

app.use(`/`, express.static(path.join(__dirname, `public`, `home`)))

// app.get(`/`, (req,res) =>
// {
//   res.send(`work`)
// })

server.listen(3000, console.log(`Server up`))
// playerManager.PlayerConnect(`jwwqs`,`swag`)

// playerManager.PlayerDisconnect(`jwwqs`)
