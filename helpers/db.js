const mongoose = require('mongoose');

const Job = require('../db/models/job/model');
const {User} = require('../db/models/user/model');
let isConnected = false;

const connectToDataBase = async() =>{
    if(isConnected){
        return true;
    }
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to database');
        isConnected = true;
        return true;
    }
    catch(error){
        console.log('Error connecting to database', error);
        return false;
    }
}

const doesUserExist = async (props) => {
    try{
        const user = await User.findOne(props);
        return user;
    }
    catch(err){
        throw err;
    }
}

module.exports.connectToDataBase = connectToDataBase;
module.exports.doesUserExist = doesUserExist;

