const express = require('express');
const router = express.Router();

const {User , USER_STATUS} = require('../../db/models/user/model');
const Profile = require('../../db/models/freelancer/model');

const {Invitation, INVITATION_STATUS} = require('../../db/models/invitation/model');
const {invitationValidator} = require('../job/validators');
const {sendInviteEmail} = require('../../helpers/email');

const validateJwt = require('../../middleware/jwt');
const mongoose = require('mongoose');
router.use(validateJwt);

router.get('/getFreelancers' , async(req , res) => {
    const projection = {
        username : 1,
        email : 1,
        userSkills : 1,
        firstName : 1,
        lastName : 1,
        userAbout : 1,
        userBio : 1,
    }
    try{
        const freelancers = await Profile.find({} , projection);
        return res.status(200).send(freelancers);
    }
    catch(err){
        console.log(err);
        return res.status(500).send(err);
    }
});

router.post('/invite' , async(req , res) => {
    const {inviteeId , invitation} = req.body;
    const {id , username} = req.user;

    if(!inviteeId || !invitation || !id) return res.status(400).send("Bad Request");

    const inviteeUsername = invitation.inviteeUsername;
    delete invitation.inviteeUsername;

    const {error} = invitationValidator.validate(invitation);
    if(error) return res.status(400).send(error.details[0].message);
    
    invitation.inviteeUsername = inviteeUsername;
    invitation.inviter = id;
    invitation.invitee = inviteeId;
    invitation.inviterUsername = username;
    try{
        const newInvitation = new Invitation(invitation);
        await newInvitation.save();
        await sendInviteEmail(invitation.inviteeEmail , invitation.inviteeUsername , username , invitation.jobTitle);
        return res.status(200).send("Invitation sent successfully");
    }
    catch(err){
        return res.status(500).send(err);
    }
});

router.get('/getInvitations' , async(req , res) => {
    const {id} = req.user;
    if(!id) return res.status(400).send("Bad Request");

    try{
        const invitations = await Invitation.find({inviter : id});
        return res.status(200).send(invitations);
    }
    catch(err){
        return res.status(500).send(err);
    }
});

router.delete('/deleteInvitation/:invitationId' , async(req , res) => {
    const {invitationId} = req.params;
    const userId = req.user.id;
    if(!invitationId || !userId) return res.status(400).send("Bad Request");

    try{
        await Invitation.deleteOne({_id : invitationId, inviter : userId});
        return res.status(200).send("Invitation Deleted Successfully");
    }
    catch(err){
        return res.status(500).send(err);
    }
})

module.exports = router;

