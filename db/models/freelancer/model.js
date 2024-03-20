// PROFILE SCHEMA 
const mongoose = require('mongoose');
 
const ProfileSchema = mongoose.Schema({
    username: {type: String,required: true},//..
    firstName: {type: String,required: true,defaultValue: ''},
    lastName: {type: String,required: true,defaultValue: ''},
    email: {type: String,required: true,defaultValue: ''},
    org: {type: String,required: true,defaultValue: ''},
    userSkills: {type: Array,required: true,defaultValue: []},
    dob: {type: Date,required: true,defaultValue: new Date},
    userAbout: {type: String,required: true,defaultValue:''},
    userBio:  {type: String,required: true,defaultValue:''},
    phone: {type: String,required: true,defaultValue: ''},
    location: {type: String,required: true,defaultValue: ''},
    github: {type: String,required: true,defaultValue: ''},
    linkedin: {type: String,required: true,defaultValue: ''},
    profileUrl: {type: String,defaultValue: ''},
})
 
const Profile = mongoose.model('Profile',ProfileSchema);
module.exports = Profile;