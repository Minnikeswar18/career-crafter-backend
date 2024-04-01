const Joi = require('joi');

const emailSchema = Joi.string()
    .email()
    .required();

const passwordSchema = Joi.string()
    .min(6)
    .max(30)
    .required()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=])[A-Za-z\d@#$%^&+=]+$/)
    .message('Password must contain at least one lowercase and one uppercase alphabet, one number and one special character (@#$%^&+=)');

const usernameSchema = Joi.string()
    .min(6)
    .max(30)
    .required()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .message('Username should contain only alphanumeric characters and underscores, starting with an alphabet or an underscore');

const otpSchema = Joi.string()
    .min(20)
    .max(50)
    .required();

const loginValidator = Joi.object({
    email: emailSchema,
    password: passwordSchema
});

const registerValidator = Joi.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
    confirmPassword: passwordSchema,
    isRecruiter: Joi.boolean()
});

const otpValidator = Joi.object({
    otp: otpSchema
});

const resetOtpValidator = Joi.object({
    password: passwordSchema,
    email: emailSchema,
    otp: otpSchema
});

module.exports = {loginValidator , registerValidator , otpValidator , resetOtpValidator};