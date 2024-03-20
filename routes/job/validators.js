const joi = require('joi');

const companyNameSchema = joi.string()
    .required()
    .regex(/^[a-zA-Z0-9\s]*$/)
    .message('Company name should contain only alphanumerics and spaces');

const jobTitleSchema = joi.string()
    .required()
    .regex(/^[a-zA-Z0-9\s]*$/)
    .message('Job role should contain only alphanumerics and spaces');

const longTextSchema = joi.string()
    .required()
    .max(1000);

const salarySchema = joi.string()
    .required()
    .regex(/^\d+(\.\d+)?$/)
    .message('Salary should contain only numbers or decimals');

const jobTypeSchema = joi.string()
    .required()
    .valid('Full Time', 'Part Time', 'Performance based FTE')

const jobExperienceSchema = joi.string()
    .required()
    .valid('Fresher (0-2 years)' , 'Intermediate (2-5 years)' , 'Expert (5+ years)')

const jobModeSchema = joi.string()
    .required()
    .valid('Work from Office', 'Work from Home', 'Hybrid')

const jobScopeSchema = joi.string()
    .required()
    .valid('Small', 'Medium', 'Large')

const salaryTypeSchema = joi.string()
    .required()
    .valid('Hourly rate (/hr)', 'Fixed price')

const skillsSchema = joi.array().items(
    joi.string()
);

const usernameSchema = joi.string()
    .min(6)
    .max(20)
    .required()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .message('Username should contain only alphanumeric characters and underscores, starting with an alphabet or an underscore');


const jobValidator = joi.object({
    companyName : companyNameSchema,
    jobTitle : jobTitleSchema,
    jobScope : jobScopeSchema,
    jobType : jobTypeSchema,
    jobMode : jobModeSchema,
    jobSkills : skillsSchema,
    jobSalary : salarySchema,
    jobExperience : jobExperienceSchema,
    jobDescription : longTextSchema,
    salaryType : salaryTypeSchema
})

const invitationValidator = joi.object({
    companyName : jobTitleSchema,
    jobTitle : companyNameSchema,
    jobScope : jobScopeSchema,
    jobType : jobTypeSchema,
    jobMode : jobModeSchema,
    jobSalary : salarySchema,
    jobDescription : longTextSchema,
    salaryType : salaryTypeSchema,
    inviteeEmail : joi.string().email().required()
})

module.exports.jobValidator = jobValidator;
module.exports.invitationValidator = invitationValidator;