const express = require('express');
const router = express.Router();

const {User , USER_STATUS} = require('../../db/models/user/model');

const Invitation = require('../../db/models/invitation/model');
const {invitationValidator} = require('../job/validators');

const validateJwt = require('../../middleware/jwt');
router.use(validateJwt);

router.get('/getFreelancers' , async(req , res) => {
    try{
        const freelancers = await User.find({userStatus : USER_STATUS.VERIFIED , isRecruiter : false});
        return res.status(200).send(freelancers);
    }
    catch(err){
        return res.status(500).send(err);
    }
});

router.post('/invite' , async(req , res) => {
    const {invitee , invitation} = req.body;
    const {id , email , username} = req.user;

    if(!invitee || !invitation || !id) return res.status(400).send("Bad Request");

    const {error} = invitationValidator.validate(invitation);
    if(error) return res.status(400).send(error.details[0].message);
    
    invitation.inviter = id;
    invitation.inviterEmail = email;
    invitation.invitee = invitee;
    invitation.inviterUsername = username;
    try{
        const newInvitation = new Invitation(invitation);
        await newInvitation.save();
        return res.status(200).send("Invitation Sent Successfully");
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

