const jwt = require('jsonwebtoken');

//starting the express router
const express = require('express');
const router = express.Router();

//loading validators
const {loginValidator , registerValidator , otpValidator , resetOtpValidator} = require('./validators');

//loading helpers
const {hashPassword , comparePassword} = require('../../helpers/password')
const {sendVerificationEmail , getRandomString  , sendResetOtp} = require('../../helpers/email');

//loading mongoDB models
const {User , USER_STATUS} = require('../../db/models/user/model');

const {ERR_CODES} = require('../../helpers/constants');

router.post('/login' , async (req, res) => {
    const { email, password } = req.body;

    const { error } = loginValidator.validate({ email, password });
    if(error){
        return res.status(400).send(error.details[0].message);
    }

    let user;
    try{
        user = await User.findOne({
            email
        });
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
    if(!user){
        return res.status(400).send(ERR_CODES[413]);
    }

    if(user.userStatus === USER_STATUS.UNVERIFIED){
        return res.status(400).send(ERR_CODES[414]);
    }

    if(user.userStatus === USER_STATUS.BLOCKED){
        return res.status(400).send(ERR_CODES[415]);
    }

    // to be remove incase of expansion of the route for freelancers too
    if(user.isRecruiter === false){
        return res.status(400).send(ERR_CODES[415]);
    }

    const isPasswordCorrect = await comparePassword(password , user.password);
    if(!isPasswordCorrect){
        return res.status(400).send(ERR_CODES[413]);
    }

    const payLoad = {
        id : user._id,
        email : user.email,
        username : user.username,
        userStatus : user.userStatus,
        isRecruiter : user.isRecruiter,
        loginTime : new Date().toString()
    }

    try{
        const token = jwt.sign(payLoad , process.env.SECRET_KEY , {expiresIn : Number(process.env.JWT_TIMEOUT)});
        res.status(200).send({token , message : "Login Successful"})
    }
    catch(err){
        return res.status(500).send(ERR_CODES[501]);
    }
});

router.post('/register' , async (req, res) => {
    const {error} = registerValidator.validate(req.body);

    if(error){
        return res.status(400).send(error.message);
    }
    else{
        const {email , username , password , confirmPassword , isRecruiter} = req.body;
        if(password !== confirmPassword){
            return res.status(400).send(ERR_CODES[409]);
        }

        try{
            const userWithUsername = await User.findOne({username});
            if(userWithUsername){
                return res.status(400).send(ERR_CODES[410]);
            }

            const userWithEmail = await User.findOne({email});
            if(userWithEmail){
                return res.status(400).send(ERR_CODES[411]);
            }
        }
        catch(err){
            return res.status(502).send(ERR_CODES[502]);
        }

        //preprocessing the data
        let hashedPassword = null , otp = null;
        try{
            hashedPassword = await hashPassword(password);
            otp = getRandomString() + username;
            await sendVerificationEmail(otp , username , email , "Thanks for registering.");
        }
        catch(err){
            return res.status(502).send(ERR_CODES[502]);
        }

        // saving the data to the database
        try{
            const newUser = new User({
                email,
                username,
                password : hashedPassword,
                otp,
                userStatus : USER_STATUS.UNVERIFIED,
                isRecruiter
            });
            await newUser.save();
            return res.status(200).send("Registration Successful and email sent successfully to " + email);
        }
        catch(err){
            return res.status(500).send(ERR_CODES[502]);
        }
    }
});

router.get('/verify/:otp?' , async (req, res) => {
    const {otp} = req.params;

    if(!otp){
        return res.status(400).send("OTP not found");
    }

    const {error} = otpValidator.validate({otp});

    if(error){
        return res.status(400).send(error.message);
    }

    try{
        const userWithOtp = await User.findOne({otp});
        if(!userWithOtp){
            return res.status(400).send(ERR_CODES[412]);
        }

        userWithOtp.userStatus = USER_STATUS.VERIFIED;
        userWithOtp.otp = null;
        await userWithOtp.save();
        return res.status(200).send("Email Verified Successfully");
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
});

router.post('/verifyjwt' , async (req, res) => {
    const token = await req.body.jwt;
    if(!token){
        return res.status(400).send("Token not found");
    }
    try{
        const decoded = await jwt.verify(token , process.env.SECRET_KEY);
        if(decoded.userStatus === USER_STATUS.BLOCKED){
            return res.status(400).send(ERR_CODES[415]);
        }

        if(decoded.userStatus === USER_STATUS.UNVERIFIED){
            return res.status(400).send(ERR_CODES[414]);
        }

        return res.status(200).send(decoded);
    }
    catch(err){
        return res.status(400).send('Invalid Token');
    }
});

router.post('/resetpassword' , async (req, res) => {
    const {email} = req.body;
    if(!email){
        return res.status(400).send("Email not found");
    }

    let user;
    try{
        user = await User.findOne({
            email
        });
    }
    catch(err){
        return res.status(500).send(ERR_CODES[502]);
    }
    
    if(!user){
        return res.status(400).send("User not found");
    }

    if(user.userStatus === USER_STATUS.UNVERIFIED){
        return res.status(400).send(ERR_CODES[414]);
    }

    if(user.userStatus === USER_STATUS.BLOCKED){
        return res.status(400).send(ERR_CODES[415]);
    }

    const otp = getRandomString();
    try{
        await sendResetOtp(otp , user.username , email , "You have requested to reset your password.");
        user.otp = otp;
        await user.save();
        return res.status(200).send("Email to reset password sent successfully to " + email);
    }
    catch(err){
        return res.status(502).send(ERR_CODES[502]);
    }
});

router.post('/changepassword' , async (req, res) => {
    const {email , password , confirmPassword , otp} = req.body;
    if(!email || !password || !confirmPassword || !otp){
        return res.status(400).send("Invalid Request");
    }

    if(password !== confirmPassword){
        return res.status(400).send(ERR_CODES[409]);
    }

    delete req.body.confirmPassword;

    const {error} = resetOtpValidator.validate(req.body);
    if(error){
        return res.status(400).send(error.message);
    }

    let user;

    try{
        user = await User.findOne({email});
    }
    catch(err){
        return res.status(502).send(ERR_CODES[502]);
    }

    if(!user){
        return res.status(400).send("User not found");
    }

    if(user.userStatus === USER_STATUS.UNVERIFIED){
        return res.status(400).send(ERR_CODES[414]);
    }

    if(user.userStatus === USER_STATUS.BLOCKED){
        return res.status(400).send(ERR_CODES[415]);
    }

    if(!user.otp || user.otp !== otp){
        return res.status(400).send(ERR_CODES[412]);
    }

    let hashedPassword = null;
    try{
        hashedPassword = await hashPassword(password);
    }
    catch(err){
        console.log(err);
        return res.status(502).send(ERR_CODES[502]);
    }

    try{
        user.password = hashedPassword;
        user.otp = null;
        await user.save();
        return res.status(200).send("Password Changed Successfully");
    }
    catch(err){
        return res.status(501).send(ERR_CODES[501]);
    }
});

module.exports = router;