const joi = require('joi');

const nameSchema = joi.string()
    .optional()
    .min(2)
    .max(30)
    .regex(/^[a-zA-Z\s]*$/)
    .message('Name should contain only alphabets');

const companyNameSchema = joi.string()
    .min(2)
    .max(30)
    .optional()
    .regex(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]*$/)
    .message('Company name should contain only alphanumerics and spaces with at least one alphabet');

const passwordSchema = joi.string()
    .min(6)
    .max(20)
    .required()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=])[A-Za-z\d@#$%^&+=]+$/)
    .message('New password must contain at least one lowercase and one uppercase alphabet, one number and one special character (@#$%^&+=)');


const profileValidator = joi.object({
    firstName : nameSchema,
    lastName : nameSchema,
    companyName : companyNameSchema,
});

const emailValidator = joi.object({
    email : joi.string().email().required(),
    password : passwordSchema
})

const passwordValidator = joi.object({
    newPassword : passwordSchema
});

module.exports = {
    profileValidator,
    emailValidator,
    passwordValidator
}
