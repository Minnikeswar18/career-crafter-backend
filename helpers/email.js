const nodemailer = require('nodemailer')

const getRandomString = () => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = "";
	for(let count = 1 ; count <= 20 ; count++){
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters.charAt(randomIndex);
	}
	return result;
}

const sendInviteEmail = async (inviteeEmail , inviteeUsername, inviterUsername , jobTitle) => {
	const TRANSPORTER = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: 587,
		secureConnection: false,
		tls: {
			ciphers: "SSLv3",
		},
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS
		}}
	);

	const mailBody = `Dear ${inviteeUsername},
	
	You have been invited by ${inviterUsername} to apply for the job of ${jobTitle}
	
	All the best for your application.`;

	const mailOptions = {
		from : process.env.SMTP_USER,
		to : inviteeEmail,
		subject : "Invitation to Apply",
		html : mailBody
	}	
};

const sendVerificationEmail = async (otp , username , receiverEmailAdd , message) => {
	const TRANSPORTER = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: 587,
		secureConnection: false,
		tls: {
			ciphers: "SSLv3",
		},
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS
		}
	})

	const mailBody = `Dear ${username},

	${message}

	Please click <a href="http://localhost:${process.env.PORT}/auth/verify/${otp}">here</a> to verify your email address.`;


	const mailOptions = {
		from : process.env.SMTP_USER,
		to : receiverEmailAdd,
		subject : "Welcome to Career Crafter",
		html : mailBody
	}

	try{
		await TRANSPORTER.sendMail(mailOptions)
	}
	catch(err){
		throw err;
	}
}

module.exports = {getRandomString , sendVerificationEmail , sendInviteEmail};