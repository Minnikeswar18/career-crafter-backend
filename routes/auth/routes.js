const jwt = require('jsonwebtoken');

//starting the express router
const express = require('express');
const router = express.Router();

//loading validators
const {loginValidator , registerValidator , otpValidator} = require('./validators');

//loading helpers
const {doesUserExist} = require('../../helpers/db');
const {hashPassword , comparePassword} = require('../../helpers/password')
const {sendVerificationEmail , getRandomString  } = require('../../helpers/email');

//loading mongoDB models
const {User , USER_STATUS} = require('../../db/models/user/model');

const ERR_CODES = {
    501 : "Error occured at Database",
    502 : "Error occured at Server",

    409 : "Passwords do not match",
    410 : "User with username already exists",
    411 : "User with email already exists",
    412 : "Invalid OTP",
    413 : "Invalid Credentials",
    414 : "User email not verified",
    415 : "Unauthorized Access",
};

router.post('/login' , async (req, res) => {
    const { email, password } = req.body;

    const { error } = loginValidator.validate({ email, password });
    if(error){
        return res.status(400).send(error.details[0].message);
    }

    const user = await doesUserExist({ email });
    if(!user){
        return res.status(400).send(ERR_CODES[413]);
    }

    if(user.userStatus === USER_STATUS.UNVERIFIED){
        return res.status(400).send(ERR_CODES[414]);
    }

    if(user.userStatus === USER_STATUS.BLOCKED){
        return res.status(400).send(ERR_CODES[415]);
    }

    const isPasswordCorrect = await comparePassword(password , user.password);
    if(!isPasswordCorrect){
        return res.status(400).send(ERR_CODES[413]);
    }

    const payLoad = {
        id : user._id,
        email,
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
        console.log(err);
        return res.status(502).send(ERR_CODES[502]);
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
            const userWithUsername = await doesUserExist({username});
            if(userWithUsername){
                return res.status(400).send(ERR_CODES[410]);
            }

            const userWithEmail = await doesUserExist({email});
            if(userWithEmail){
                return res.status(400).send(ERR_CODES[411]);
            }
        }
        catch(err){
            console.log(err);
            return res.status(502).send(ERR_CODES[502]);
        }

        //preprocessing the data
        let hashedPassword = null , otp = null;
        try{
            hashedPassword = await hashPassword(password);
            otp = getRandomString() + username;
            await sendVerificationEmail(otp , username , email);
        }
        catch(err){
            console.log(err);
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
            console.log(err);
            return res.status(501).send(ERR_CODES[501]);
        }
    }
});

router.get('/verify/:otp' , async (req, res) => {
    const {otp} = req.params;

    if(!otp){
        return res.status(400).send("OTP not found");
    }

    const {error} = otpValidator.validate({otp});

    if(error){
        return res.status(400).send(error.message);
    }

    const userWithOtp = await doesUserExist({otp});
    if(!userWithOtp){
        return res.status(400).send(ERR_CODES[412]);
    }

    try{
        userWithOtp.userStatus = USER_STATUS.VERIFIED;
        userWithOtp.otp = null;
        await userWithOtp.save();
        return res.status(200).send("Email Verified Successfully");
    }
    catch(err){
        console.log(err);
        return res.status(501).send(ERR_CODES[501]);
    }
});

router.post('/verifyjwt' , async (req, res) => {
    const token = await req.body.jwt;
    if(!token){
        return res.status(400).send("Token not found");
    }
    try{
        const decoded = jwt.verify(token , process.env.SECRET_KEY);
        if(decoded.userStatus === USER_STATUS.BLOCKED){
            return res.status(400).send(ERR_CODES[415]);
        }

        if(decoded.userStatus === USER_STATUS.UNVERIFIED){
            return res.status(400).send(ERR_CODES[414]);
        }

        return res.status(200).send(decoded);
    }
    catch(err){
        return res.status(400).send("Invalid Token");
    }
});

module.exports = router;