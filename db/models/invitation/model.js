const mongoose = require('mongoose')

const invitationSchema = mongoose.Schema({
    invitee : {type : mongoose.Schema.Types.ObjectId , ref : 'User'},
    inviter : {type : mongoose.Schema.Types.ObjectId , ref : 'User'},
    createdAt : {type : Date , required : true , default : Date.now},
    companyName : {type : String , required : true},
    jobTitle : {type : String , required : true},
    jobType : {type : String , required : true},
    jobMode : {type : String , required : true},
    jobScope : {type : String , required : true},
    jobSalary : {type : String , required : true},
    salaryType : {type : String , required : true},
    jobDescription : {type : String , required : true},
    status : {type : String , required : true , default : 'pending'},
});

const Invitation = mongoose.model('invitation',invitationSchema);

module.exports = Invitation;