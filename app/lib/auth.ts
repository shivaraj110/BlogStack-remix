import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sendMail } from './email';
import { prisma } from '~/.server/db';
export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		autoSignIn: false,
		sendResetPassword: async ({ user, url, token }, request) => {
			await sendMail({
				from: 'blogstack.site',
				to: user.email,
				subject: 'Reset your password',
				html: `<h2><a href=${url}>Click the link to reset your password</a></h2>`,
			});
		}
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }, request) => {
			await sendMail({
				from: 'blogstack.site',
				to: user.email,
				subject: 'Verify your email address',
				html: `<h2><a href=${url}>Click the link to verify your email<a/></h2>`,
			});
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
});
