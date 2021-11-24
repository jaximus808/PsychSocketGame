const express = require(`express`);
const app = express();

app.get(`/`, (req,res) =>
{
  res.send(`work`)
})

app.listen(3000, console.log(`Server up`))