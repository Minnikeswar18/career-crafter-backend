const express = require('express');
const router = express.Router();
const validateJwt = require('../../middleware/jwt');
const Job = require('../../db/models/job/model');
const Profile = require('../../db/models/freelancer/model');
const assignScores = require('../../helpers/recommend');
const {ERR_CODES} = require('../../helpers/constants');

router.use(validateJwt);

router.get('/myjobs' , async(req , res) => {
    const {id} = req.user;

    try{
        const projection = {
            datePosted : 1 , 
            jobTitle : 1 ,
            companyName : 1
        }
        const jobs = await Job.find({postedBy : id} , projection);
        return res.status(200).send(jobs);
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
});

router.get('/similarProfiles/:jobId?' , async(req , res) => {
    const {jobId} = req.params;
    if(!jobId){
        return res.status(400).send("Invalid Job Id");
    }

    const {id} = req.user;
    try{
        const job = await Job.findOne({_id : jobId , postedBy : id});
        if(!job){
            return res.status(404).send("Job Not Found");
        }

        const projection = {
            username : 1 ,
            firstName : 1 ,
            lastName : 1 ,
            email : 1 ,
            userSkills : 1 ,
            userAbout : 1 ,
            userBio : 1 ,
        }

        const profiles = await Profile.find({} , projection);
        const result  = await assignScores(profiles , job);
        return res.status(200).send(result);
    }
    catch(err){
        
        return res.status(500).send(ERR_CODES[502]);
    }
});

module.exports = router;