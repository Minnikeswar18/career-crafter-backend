const express = require('express');
const router = express.Router();
const validateJwt = require('../../middleware/jwt');
const Job = require('../../db/models/job/model');
const {Application , APPLICATION_STATUS} = require('../../db/models/application/model');

const getNextSequenceValue = require('../../helpers/sequence');
const {jobValidator} = require('./validators');
const { ERR_CODES } = require('../../helpers/constants');

router.use(validateJwt);

router.post('/add' , async(req , res) => {
    
    const {id} = req.user;

    const job = req.body.newJob;
    if(!job){
        return res.status(400).send("Invalid Job Data");
    }

    const {error} = jobValidator.validate(job);
    if(error){
        return res.status(400).send(error.details[0].message);
    }

    job.datePosted = new Date();
    job.postedBy = id;
    
    try{
        job.jobId = await getNextSequenceValue('jobId');
        const newJob = new Job(job);
        await newJob.save();
        return res.status(200).send("Job Added");
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
    
});

router.get('/myjobs' , async(req , res) => {
    const {id} = req.user;
    try{
        const jobs = await Job.find({postedBy : id});
        return res.status(200).send(jobs);
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
});

router.delete('/delete/:jobId?' , async(req , res) => {
    const {id} = req.user;
    const jobId = req.params.jobId;
    
    if(!jobId | jobId == 'undefined'){
        return res.status(400).send("Invalid Job Id");
    }

    try{
        await Job.deleteOne({_id : jobId , postedBy : id});
        await Application.deleteMany({jobId , recruiterId : id})
        return res.status(200).send("Job Deleted successfully");
    }
    catch(err){
        return res.status(500).send(err);
    }
});

router.get('/getApplications/:jobId?' , async(req , res) => {
    const {id} = req.user;
    const jobId = req.params.jobId;
    
    if(!jobId || jobId == 'undefined'){
        return res.status(400).send("Invalid Job Id");
    }
    
    try{
        let applications = await Application.find({jobId , recruiterId : id});
        applications = await Application.populate(applications, { path: 'appliedBy' });
        return res.status(200).send(applications);
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
});

router.post('/approveApplication' , async(req , res) => {
    const {id} = req.user;
    const applicationId = req.body.applicationId;

    if(!applicationId){
        return res.status(400).send("Invalid Application Id");
    }

    try{
        const application = await Application.findOne({_id : applicationId , recruiterId : id});
        if(!application){
            return res.status(400).send("Invalid Application");
        }
        if(application.status !== APPLICATION_STATUS.PENDING){
            return res.status(400).send("Application already processed");
        }
        application.status = APPLICATION_STATUS.ACCEPTED;
        await application.save();
        return res.status(200).send("Application Approved");
    }
    catch(err){
        return res.status(500).send(err);
    }
});

router.post('/rejectApplication' , async(req , res) => {
    const {id} = req.user;
    const applicationId = req.body.applicationId;

    if(!applicationId){
        return res.status(400).send("Invalid Application Id");
    }

    try{
        const application = await Application.findOne({_id : applicationId , recruiterId : id});
        if(!application){
            return res.status(400).send("Invalid Application");
        }
        if(application.status !== APPLICATION_STATUS.PENDING){
            return res.status(400).send("Application already processed");
        }

        application.status = APPLICATION_STATUS.REJECTED;
        await application.save();
        return res.status(200).send("Application Rejected");
    }
    catch(err){
        return res.status(500).send(err);
    }
});

module.exports = router;