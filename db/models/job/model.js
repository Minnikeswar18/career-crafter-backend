const mongoose = require('mongoose');
const {User} = require('../user/model');
const Schema = mongoose.Schema;

const jobSchema = new mongoose.Schema({
    companyName : {type : String , required : true},
    jobTitle : {type : String , required : true},
    jobType : {type : String , required : true},
    jobMode : {type : String , required : true},
    jobScope : {type : String , required : true},
    jobSalary : {type : String , required : true},
    salaryType : {type : String , required : true},
    jobExperience : {type : String , required : true},
    jobDescription : {type : String , required : true},
    jobSkills : {type : Array , required : true},
    datePosted : {type : Date , required : true},
    postedBy : {type: Schema.Types.ObjectId, ref: 'User', required: true},
    jobId : {type : Number , required : true},
});

const Job = mongoose.model('job', jobSchema);

module.exports = Job;