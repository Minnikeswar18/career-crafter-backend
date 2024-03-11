const express = require('express');
const router = express.Router();
const validateJwt = require('../../middleware/jwt');
const Job = require('../../db/models/job/model');

const getNextSequenceValue = require('../../helpers/sequence');

const {USER_STATUS} = require('../../db/models/user/model');

const jobValidator = require('./validators');

router.use(validateJwt);

router.post('/add' , async(req , res) => {
    
    const {userStatus , id , isRecruiter} = req.user;
    if(isRecruiter === false || userStatus === USER_STATUS.BLOCKED){
        return res.status(415).send("Unauthorized Access");
    }

    if(userStatus === USER_STATUS.UNVERIFIED){
        return res.status(415).send("Unverified User");
    }

    const job = req.body;
    if(!job){
        return res.status(400).send("Invalid Job Data");
    }

    const {error} = jobValidator.validate(job);
    if(error){
        return res.status(400).send(error.details[0].message);
    }

    job.datePosted = new Date();
    job.postedBy = id;
    job.jobId = await getNextSequenceValue('jobId');

    try{
        const newJob = new Job(job);
        await newJob.save();
        return res.status(200).send("Job Added");
    }
    catch(err){
        return res.status(500).send(err);
    }
    
});

router.get('/myjobs' , async(req , res) => {
    const {id} = req.user;
    try{
        const jobs = await Job.find({postedBy : id});
        return res.status(200).send(jobs);
    }
    catch(err){
        return res.status(500).send(err);
    }
});

router.delete('/delete/:jobId' , async(req , res) => {
    const {id} = req.user;
    const jobId = req.params.jobId;
    
    if(!jobId){
        return res.status(400).send("Invalid Job Id");
    }

    try{
        await Job.deleteOne({jobId , postedBy : id});
        return res.status(200).send("Job Deleted");
    }
    catch(err){
        return res.status(500).send(err);
    }
});

module.exports = router;