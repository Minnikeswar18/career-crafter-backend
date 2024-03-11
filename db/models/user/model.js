const mongoose = require('mongoose')

const USER_STATUS = {
    ADMIN : 2,
    VERIFIED : 1,
    BLOCKED : 0,
    UNVERIFIED : -1,
}

const userSchema = mongoose.Schema({
    companyName : {type : String},
    firstName : {type : String },
    lastName : {type : String },
    username : {type : String , required: true , unique : [true , "User with given username already exists"]},
    email: {type: String, required: true , unique : [true , "User with given email already exists"]},
    password: {type: String, required: true},
    otp : {type : String},
    userStatus : {type : Number , required : true},
    isRecruiter : {type : Boolean , required : true , default : false},
    createdAt : {type : Date , required : true , default : Date.now},
});

const User = mongoose.model('User',userSchema);

module.exports = {User , USER_STATUS};