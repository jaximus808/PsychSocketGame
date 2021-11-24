module.exports = class PlayerManager{
  constructor()
  {
    this.crypto = 
    this.PlayerData = {};
    //
    this.TeamData = {
      //Red
      0: {
        ids:[]
      },
      //Blue
      1: {
        ids:[]
      },
      //Yellow
      2:{
        ids:[]
      },
      //Green
      3:{
        ids:[]
      }
    };
  }

  PlayerConnect(_id, name)
  {
    this.PlayerData[_id] = 
    {
      username:name,
      teamId: `notSet`,
    }
    console.log(this.PlayerData)
  }

  PlayerDisconnect(_id)
  {
    if(this.TeamData[this.PlayerData[_id].teamId])
    {
      let newArray = [];
      for(let i in this.TeamData[this.PlayerData[_id].teamId].ids)
      {
        if(i != _id) newArray.append(i);
      }
    }
    delete this.PlayerData[_id];
    console.log(this.PlayerData)
  }
}