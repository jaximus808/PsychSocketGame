const socket = io();

socket.on("test",(message) =>
{
  document.getElementById("test").innerHTML = message
  })