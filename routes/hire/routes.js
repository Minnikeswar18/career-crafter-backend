const express = require('express');
const router = express.Router();

const Profile = require('../../db/models/freelancer/model');

const {ERR_CODES} = require('../../helpers/constants')
const {Invitation} = require('../../db/models/invitation/model');
const {invitationValidator} = require('../job/validators');
const {sendInviteEmail , getRandomRoomId , sendChatInvite} = require('../../helpers/email');

const validateJwt = require('../../middleware/jwt');
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
        return res.status(500).send(ERR_CODES[502]);
    }
});

router.post('/invite' , async(req , res) => {
    const {inviteeId , invitation} = req.body;
    const {id , username} = req.user;

    if(!inviteeId || !invitation) return res.status(400).send("Bad Request");
    
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
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
    try{
        await sendInviteEmail(invitation.inviteeEmail , invitation.inviteeUsername , username , invitation.jobTitle);
        return res.status(200).send("Invitation sent successfully");
    }
    catch(err){
        return res.status(500).send(ERR_CODES[501]);
    }
});

router.get('/getInvitations' , async(req , res) => {
    const {id} = req.user;

    try{
        const invitations = await Invitation.find({inviter : id});
        return res.status(200).send(invitations);
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
});

router.delete('/deleteInvitation/:invitationId?' , async(req , res) => {
    const {invitationId} = req.params;
    const userId = req.user.id;
    if(!invitationId) return res.status(400).send("Bad Request");

    try{
        await Invitation.deleteOne({_id : invitationId, inviter : userId});
        return res.status(200).send("Invitation Deleted Successfully");
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
})

router.post('/inviteToChat' , async(req , res) => {
    const {dest} = req.body;
    const {email , username} = req.user;
    
    if(!dest) return res.status(400).send("Bad Request");
    const {inviteeEmail , inviteeUsername} = dest;

    const roomId = getRandomRoomId();
    try{
        await sendChatInvite(roomId , inviteeUsername , inviteeEmail , `${username} has invited you to a chat.`);
    }
    catch(err){
        console.log(err);
        return res.status(500).send(`Error sending chat invite to ${inviteeUsername}`);
    }

    try{
        await sendChatInvite(roomId , username , email , `You have invited ${inviteeUsername} to a chat.`);
        return res.status(200).send("Chat Invite Sent Successfully");
    }
    catch(err){
        return res.status(500).send(`Error sending chat invite to ${username}`);
    }
});

module.exports = router;

