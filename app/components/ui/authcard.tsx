import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Icons } from './icons';
import { Button } from './button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from './card';
import { Input } from './input';
import { Label } from './label';
import { useState } from 'react';
import { authClient } from 'app/lib/auth-client';
import { redirect, useNavigation } from '@remix-run/react';

export function AuthCard(mode: {
	mode: 'signin' | 'signup' | 'verification';
}) {
	const [Mode, setMode] = useState<'signin' | 'signup' | 'verification'>(
		mode.mode,
	);
	const [email, setEmail] = useState<string>('');
	const [name, setName] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const router = useNavigation();

	const onSignInEmail = async () => {
		const { data, error } = await authClient.signIn.email(
			{
				email: email, // user email address
				password: password, // user password -> min 8 characters by default
				callbackURL: '/',
			},
			{
				onRequest: ctx => {
					setLoading(true);
				},
				onSuccess: ctx => {
					redirect('/dashboard');
				},
				onError: ctx => {
					// display the error message
					alert(ctx.error.message);
				},
			},
		);
	};
	const onSigninGithub = async () => {
		const { data, error } = await authClient.signIn.social({
			provider: 'github',
		});
	};
	const onSigninGoogle = async () => {
		const { data, error } = await authClient.signIn.social({
			provider: 'google',
		});
	};
	const onSignupEmail = async () => {

		setMode('verification');

		const { data, error } = await authClient.signUp.email(
			{
				email: email, // user email address
				password: password, // user password -> min 8 characters by default
				name: name, // user display name
				callbackURL: '/',
			},
			{
				onRequest: ctx => {
					setLoading(true);
				},
				onSuccess: ctx => {
					redirect('/');
				},
				onError: ctx => {
					// display the error message
					alert(ctx.error.message);
				},
			},
		);
	};

	const onSignupGithub = async () => {
		const { data, error } = await authClient.signIn.social({
			provider: 'github',
		});
	};
	const onSignupGoogle = async () => {
		const { data, error } = await authClient.signIn.social({
			provider: 'google',
		});
	};
	if (Mode === 'signup') {
		return (
			<Card className="transform-card">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl">Create an account</CardTitle>
					<CardDescription>
						You need an account to interact with the articles and share your
						own!
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid grid-cols-2 gap-6">
						<Button
							variant="outline"
							className="cursor-pointer"
							onClick={onSignupGithub}
						>
							<Icons.gitHub />
							GitHub
						</Button>
						<Button
							variant="outline"
							className="cursor-pointer"
							onClick={onSignupGoogle}
						>
							<Icons.google />
							Google
						</Button>
					</div>
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-sm uppercase">
							<span className="bg-card px-2 text-muted-foreground">
								or continue with
							</span>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							type="text"
							placeholder="Roronoa Zoro"
							onChange={e => {
								setName(e.target.value);
							}}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="address@example.com"
							onChange={e => {
								setEmail(e.target.value);
							}}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							onChange={e => {
								setPassword(e.target.value);
							}}
						/>

					</div>
				</CardContent>
				<CardFooter className="flex-col space-y-2 pb-2">
					<Button className="w-full" onClick={onSignupEmail}>
						Create account
					</Button>
					<p>
						already have an account?{' '}
						<strong
							className="underline cursor-pointer"
							onClick={() => {
								setMode('signin');
							}}
						>
							signin
						</strong>
					</p>
				</CardFooter>
			</Card>
		);
	} else if (Mode === 'signin') {
		return (
			<Card className="transform-card">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl">Sign in to your account</CardTitle>
					<CardDescription>
						aplicable only for registered users.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid grid-cols-2 gap-6">
						<Button
							variant="outline"
							className="cursor-pointer"
							onClick={onSigninGithub}
						>
							<Icons.gitHub />
							GitHub
						</Button>
						<Button
							variant="outline"
							className="cursor-pointer"
							onClick={onSigninGoogle}
						>
							<Icons.google />
							Google
						</Button>
					</div>
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-sm uppercase">
							<span className="bg-card px-2 text-muted-foreground">
								or continue with
							</span>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="address@example.com"
							onChange={e => {
								setEmail(e.target.value);
							}}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							onChange={e => {
								setPassword(e.target.value);
							}}
						/>
						<p className='text-sm
							'>Forgot password ? <strong className='underline cursor-pointer'> reset password</strong> </p>

					</div>
				</CardContent>
				<CardFooter className="flex-col space-y-2 pb-2">
					<DialogPrimitive.Close
						className="w-full bg-black/90 hover:bg-black/80 delay-75 transition-all text-white p-[6px] text-center rounded-lg"
						onClick={onSignInEmail}
					>
						{' '}
						Sign in
					</DialogPrimitive.Close>
					<p>
						don't have an account?{' '}
						<strong
							className="underline cursor-pointer"
							onClick={() => {
								setMode('signup');
							}}
						>
							signup
						</strong>
					</p>
				</CardFooter>
			</Card>
		);
	} else if (Mode === 'verification') {
		return (
			<Card className="transform-card">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl">Verify your email account</CardTitle>
					<CardDescription>login using the verification url</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					check your inbox at {email}
				</CardContent>
			</Card>
		);
	}
}
