const ERR_CODES = {
    502 : "Error occured at Database",
    501 : "Error occured at Server",

    409 : "Passwords do not match",
    410 : "User with username already exists",
    411 : "User with email already exists",
    412 : "Invalid OTP",
    413 : "Invalid Credentials",
    414 : "User email not verified",
    415 : "Unauthorized Access",
};

module.exports = {ERR_CODES};