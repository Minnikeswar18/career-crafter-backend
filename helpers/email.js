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

const getRandomRoomId = () => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = "";
	for(let count = 1 ; count <= 10 ; count++){
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

	const mailBody = `Dear ${inviteeUsername},<br><br>
	
	You have been invited by ${inviterUsername} to join for the job of ${jobTitle}.<br><br>
	
	All the best for your application.`;

	const mailOptions = {
		from : process.env.SMTP_USER,
		to : inviteeEmail,
		subject : "Invitation to join",
		html : mailBody
	}
	
	try{
		await TRANSPORTER.sendMail(mailOptions)
	}
	catch(err){
		throw err;
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

	const mailBody = `Dear ${username},<br><br>

	${message}<br><br>

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

const sendResetOtp = async (otp , username , receiverEmailAdd , message) => {
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

	const mailBody = `Dear ${username},<br><br>

	${message}<br><br>

	Please click <a href="http://localhost:${process.env.FRONTEND_PORT}/resetPassword/${otp}">here</a> to reset your password.`;

	const mailOptions = {
		from : process.env.SMTP_USER,
		to : receiverEmailAdd,
		subject : "Request to reset password",
		html : mailBody
	}

	try{
		await TRANSPORTER.sendMail(mailOptions)
	}
	catch(err){
		throw err;
	}
}

const sendChatInvite = async (roomId , username , receiverEmailAdd , message) => {
	const TRANSPORTER = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: 587,
		secureConnection: true,
		tls: {
			ciphers: "SSLv3",
		},
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS
		}
	})

	const key = atob(`${username}/${roomId}`)

	const mailBody = `Dear ${username},<br><br>

	${message}<br><br>

	Please click <a href="http://localhost:${process.env.FRONTEND_PORT}/chat/${key}">here</a> to join the chat.`;

	const mailOptions = {
		from : process.env.SMTP_USER,
		to : receiverEmailAdd,
		subject : "Invite for chat",
		html : mailBody
	}

	try{
		await TRANSPORTER.sendMail(mailOptions)
	}
	catch(err){
		throw err;
	}
}

module.exports = {getRandomString , sendVerificationEmail , sendInviteEmail , sendResetOtp , getRandomRoomId , sendChatInvite};