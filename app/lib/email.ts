import winston from 'winston';
import nodemailer from 'nodemailer';
const logger = winston.createLogger({
	level: 'debug',
	format: winston.format.json(),
	transports: [new winston.transports.Console()],
});

interface MailData {
	from: string;
	to: string;
	subject: string;
	html: string;
}

export const sendMail = async (data: MailData) => {
	const transporter = nodemailer.createTransport({
		service: process.env.MAIL_HOST,
		auth: {
			user: process.env.MAIL_USERNAME,
			pass: process.env.MAIL_PASSWORD,
		},
	});

	const mailOptions = {
		from: process.env.MAIL_USERNAME,
		to: data.to,
		subject: data.subject,
		html: data.html,
	};

	logger.info(`Sending mail to - ${data.to}`);
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			logger.error(error);
		} else {
			logger.info('Email sent: ' + info.response);
		}
	});
};
