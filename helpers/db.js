const mongoose = require('mongoose');

const connectToDataBase = async() =>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');
        return true;
    }
    catch(error){
        console.log('Error connecting to database', error);
        return false;
    }
}

module.exports.connectToDataBase = connectToDataBase;

