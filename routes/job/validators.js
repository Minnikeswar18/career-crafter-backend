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
    // .message('Job Type should be Full Time, Part Time or Performance based FTE');

const jobExperienceSchema = joi.string()
    .required()
    .valid('Fresher (0-2 years)' , 'Intermediate (2-5 years)' , 'Expert (5+ years)')
    // .message('Job Experience should be Fresher (0-2 years), Intermediate (2-5 years) or Expert (5+ years)');

const jobModeSchema = joi.string()
    .required()
    .valid('Work from Office', 'Work from Home', 'Hybrid')
    // .message('Job Mode should be Work from Office, Work from Home or Hybrid');

const jobScopeSchema = joi.string()
    .required()
    .valid('Small', 'Medium', 'Large')
    // .message('Job Scope should be Small, Medium or Large');

const salaryTypeSchema = joi.string()
    .required()
    .valid('Hourly rate (/hr)', 'Fixed price')
    // .message('Salary Type should be Hourly rate (/hr) or Fixed price');

const skillsSchema = joi.array().items(
    joi.string()
);

const jobValidator = joi.object({
    companyName : jobTitleSchema,
    jobTitle : companyNameSchema,
    jobScope : jobScopeSchema,
    jobType : jobTypeSchema,
    jobMode : jobModeSchema,
    jobSkills : skillsSchema,
    jobSalary : salarySchema,
    jobExperience : jobExperienceSchema,
    jobDescription : longTextSchema,
    salaryType : salaryTypeSchema
})

module.exports = jobValidator;