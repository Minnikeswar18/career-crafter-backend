const express = require('express');
const router = express.Router();

const {profileValidator , emailValidator , passwordValidator} = require('./validators');
const { comparePassword , hashPassword } = require('../../helpers/password');
const {sendVerificationEmail , getRandomString} = require('../../helpers/email');
const validateJwt = require('../../middleware/jwt');
const {User , USER_STATUS } = require('../../db/models/user/model');
const { ERR_CODES } = require('../../helpers/constants');

router.use(validateJwt);

router.get('/getProfile' , async(req , res) => {
    const {id} = req.user;

    try{
        const user = await User.findOne({_id : id});
        if(!user) return res.status(400).send("User Not Found");

        const profile = {
            firstName : user.firstName,
            lastName : user.lastName,
            companyName : user.companyName,
            email : user.email,
            username : user.username,
        };
        return res.status(200).send(profile);
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
});

router.post('/updateProfile' , async(req , res) => {
    const {id} = req.user;

    const {profile} = req.body;
    if(!profile) return res.status(400).send("Bad Request");

    if(!profile.firstName) delete profile.firstName;
    if(!profile.lastName) delete profile.lastName;
    if(!profile.companyName) delete profile.companyName;

    const {error} = profileValidator.validate(profile);
    if(error) return res.status(400).send(error.details[0].message);
    
    try{
        const user = await User.findOne({_id : id});
        if(!user) return res.status(404).send("User Not Found");

        user.firstName = profile.firstName;
        user.lastName = profile.lastName;
        user.companyName = profile.companyName;

        await user.save();
        return res.status(200).send("Profile Updated Successfully");
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
});

router.post('/changeEmail' , async(req , res) => {
    const {id , username} = req.user;
    
    const {error} = emailValidator.validate(req.body.data);
    if(error) return res.status(400).send(error.details[0].message);
    
    const {email , password} = req.body.data;
    const otp = getRandomString() + username;
    try{
        const user = await User.findOne({email});
        if(user){
            if(user._id.toString() === id) return res.status(400).send("Email is same as previous one");
            return res.status(400).send("User with this email exists")
        }

        const currUser = await User.findOne({_id : id});
        if(!currUser) return res.status(400).send("User Not Found");

        const isMatch = await comparePassword(password , currUser.password);

        if(!isMatch) return res.status(400).send("Invalid Password");

        currUser.email = email;
        currUser.userStatus = USER_STATUS.UNVERIFIED;
        currUser.otp = otp;
        await currUser.save();
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
    try{
        await sendVerificationEmail(otp , username , email , "Your email has been updated successfully.");
    }
    catch(err){
        return res.status(500).send("Email updated successfully but verification email could not be sent");
    }
    return res.status(200).send("Email updated successfully and verification email sent");
});

router.post('/changePassword' , async(req , res) => {
    const {id} = req.user;

    const {currentPassword , newPassword , confirmNewPassword} = req.body.data;

    if(newPassword !== confirmNewPassword) return res.status(400).send("New passwords do not match");

    const {error} = passwordValidator.validate({newPassword});
    if(error) return res.status(400).send(error.details[0].message);

    try{
        const user = await User.findOne({_id : id});
        if(!user) return res.status(400).send("User Not Found");
        const isMatchWithOld = await comparePassword(currentPassword , user.password);
        if(!isMatchWithOld) return res.status(400).send("Invalid current password");

        if(currentPassword === newPassword) return res.status(400).send("New Password is same as old password");

        user.password = await hashPassword(newPassword);
        await user.save();
        return res.status(200).send("Password Changed Successfully");
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
});

module.exports = router;