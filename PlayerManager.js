module.exports = class PlayerManager{
  constructor()
  {
    this.crypto = 
    this.PlayerData = {};
    this.GameManager;
    this.TeamData = {
      //Red
      0: {
        name: "Red",
        ids:[]
      },
      //Blue
      1: {
        name: "Blue",
        ids:[]
      },
      //Yellow
      2:{
        name: "Yellow",
        ids:[]
      },
      //Green
      3:{
        name: "Green",
        ids:[]
      }
    };
  }

  PlayerConnect(_id, name)
  {
    const adminSet = Object.keys(this.PlayerData).length == 0;
    let min = 10000000; 
    let assignableTeams = [];
    for(let i = 0; i < 4; i++)
    {
      if(this.TeamData[i].ids.length < min) min = this.TeamData[i].ids.length; 
    }
    for(let i = 0; i < 4; i++)
    {
      if(this.TeamData[i].ids.length <= min) assignableTeams.push(i); 
    }
    var setTeamId = assignableTeams[Math.floor(Math.random()*assignableTeams.length)];
    this.TeamData[setTeamId].ids.push(_id);
    console.log(`New player is assigned ${this.TeamData[setTeamId].name}`)

    const playerData = {
      username:name,
      teamId: setTeamId,
      admin:adminSet
    }

    this.PlayerData[_id] = playerData
    
    console.log(this.PlayerData)
    
    console.log(this.TeamData)
    return playerData;
  }

  PlayerDisconnect(_id)
  {
    if(this.TeamData[this.PlayerData[_id].teamId])
    {
      let newArray = [];
      for(let i = 0; i < this.TeamData[this.PlayerData[_id].teamId].ids.length; i++)
      {
        if(this.TeamData[this.PlayerData[_id].teamId].ids[i] != _id) this.TeamData[this.PlayerData[_id].teamId].ids[i];
      }
      this.TeamData[this.PlayerData[_id].teamId].ids = newArray
    }
    if(this.PlayerData[_id].admin && Object.keys(this.PlayerData).length-1 > 0)
    {
      //we need to create a new admin, 
      this.PlayerData[Object.keys(this.PlayerData)[1]].admin = true;
    }
    delete this.PlayerData[_id];
    console.log(this.PlayerData)
  }
}