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

const sendVerificationEmail = async (otp , username , receiverEmailAdd) => {
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

	Thank you for registering. Please click the link below to verify your email address:
	
	http://localhost:${process.env.PORT}/auth/verify/${otp}`

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

module.exports = {getRandomString , sendVerificationEmail}
//anchor