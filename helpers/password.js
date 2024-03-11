const bcrypt = require('bcryptjs');

const comparePassword = async (password, hashedPassword) => {
    try{
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    }
    catch(err){
        throw err;
    }
}

const hashPassword = async (plainPassword) =>{
    try{
        const hashedPassword = await bcrypt.hash(plainPassword, Number(process.env.SALT_ROUNDS));
        return hashedPassword;
    }
    catch(err){
        throw err;
    }
}

module.exports = {comparePassword , hashPassword}