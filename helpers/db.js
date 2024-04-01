const mongoose = require('mongoose');
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

module.exports.connectToDataBase = connectToDataBase;

