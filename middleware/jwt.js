const jwt = require('jsonwebtoken');
const {USER_STATUS} = require('../db/models/user/model');

const ERR_CODES = {
    501 : "Error occured at Database",
    502 : "Error occured at Server",

    409 : "Passwords do not match",
    410 : "User with username already exists",
    411 : "User with email already exists",
    412 : "Invalid OTP",
    413 : "Invalid Credentials",
    414 : "User not verified",
    415 : "Unauthorized Access",
};

const validateJwt = (req , res , next) => {
    
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).send(ERR_CODES[502]);
    }

    const token = authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const {userStatus , isRecruiter} = decoded;

        if(userStatus === USER_STATUS.BLOCKED || isRecruiter === false){
            return res.status(401).send(ERR_CODES[415]);
        }
        
        if(userStatus === USER_STATUS.UNVERIFIED){
            return res.status(401).send(`${isRecruiter ? 'Recruiter' : 'User'} not verified`);
        }

        const validUserStatus = Object.values(USER_STATUS);

        if(validUserStatus.includes(userStatus) === false){
            return res.status(401).send(ERR_CODES[502]);
        }

        req.user = decoded;

        return next();
    }
    catch(err){
        console.log(err);
        return res.status(401).send(ERR_CODES[502]);
    }
}

module.exports = validateJwt;