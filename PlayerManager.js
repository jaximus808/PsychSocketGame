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
    const adminSet = Object.keys(this.PlayerData).length == 0;
    
    this.PlayerData[_id] = 
    {
      username:name,
      teamId: `notSet`,
      admin:adminSet
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
    if(this.PlayerData[_id].admin && Object.keys(this.PlayerData).length-1 > 0)
    {
      //we need to create a new admin, 
      this.PlayerData[Object.keys(this.PlayerData)[1]].admin = true;
    }
    delete this.PlayerData[_id];
    console.log(this.PlayerData)
  }
}