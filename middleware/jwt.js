const jwt = require('jsonwebtoken');
const {USER_STATUS} = require('../db/models/user/model');

const {ERR_CODES} = require('../helpers/constants');

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