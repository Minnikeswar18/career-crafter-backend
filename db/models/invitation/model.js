const mongoose = require('mongoose')

const INVITATION_STATUS = {
    ACCEPTED : 1,
    PENDING : 0,
    REJECTED : -1,
}

const invitationSchema = mongoose.Schema({
    invitee : {type : mongoose.Schema.Types.ObjectId , ref : 'Profile' , required : true},
    inviter : {type : mongoose.Schema.Types.ObjectId , ref : 'User' , required : true},
    inviteeUsername : {type : String , required : true},
    inviterUsername : {type : String , required : true},
    inviteeEmail : {type : String , required : true},
    createdAt : {type : Date , required : true , default : Date.now},
    companyName : {type : String , required : true},
    jobTitle : {type : String , required : true},
    jobType : {type : String , required : true},
    jobMode : {type : String , required : true},
    jobScope : {type : String , required : true},
    jobSalary : {type : String , required : true},
    salaryType : {type : String , required : true},
    jobDescription : {type : String , required : true},
    status : {type : Number , required : true , default : INVITATION_STATUS.PENDING},
});

const Invitation = mongoose.model('invitation',invitationSchema);

module.exports = {Invitation , INVITATION_STATUS};