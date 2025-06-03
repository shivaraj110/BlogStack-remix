import { Link } from "@remix-run/react";
import { SignInButton, SignUpButton, useUser } from "@clerk/remix";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AuthCard } from "./ui/authcard";
import { Button } from "./ui/button";

export default function PublicNavbar() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const { user, isLoaded } = useUser();

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const toggleProfile = () => {
		setIsProfileOpen(!isProfileOpen);
	};

	return (
		<nav className="bg-[#0a0a0a] border-b border-white/10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex items-center">
						<Link to="/" className="flex-shrink-0 flex items-center">
							<span className="text-white font-bold text-xl">BlogStack</span>
						</Link>
						<div className="hidden md:ml-6 md:flex md:space-x-8">
							<Link
								to="/blog"
								className="text-white/80 hover:text-white border-transparent hover:border-white/80 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
							>
								Explore
							</Link>
							<Link
								to="/blog?tag=Technology"
								className="text-white/80 hover:text-white border-transparent hover:border-white/80 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
							>
								Technology
							</Link>
							<Link
								to="/blog?tag=Design"
								className="text-white/80 hover:text-white border-transparent hover:border-white/80 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
							>
								Design
							</Link>
							<Link
								to="/blog?tag=Business"
								className="text-white/80 hover:text-white border-transparent hover:border-white/80 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
							>
								Business
							</Link>
							<Link
								to="/team"
								className="text-white/80 hover:text-white border-transparent hover:border-white/80 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
							>
								Team
							</Link>
						</div>
					</div>
					<div className="hidden md:ml-6 md:flex md:items-center">
						{isLoaded && user ? (
							<div className="relative">
								<button
									onClick={toggleProfile}
									className="flex items-center space-x-3 text-white focus:outline-none"
								>
									<div className="flex items-center space-x-3">
										{user.imageUrl ? (
											<img
												src={user.imageUrl}
												alt={user.firstName || user.username || "User"}
												className="w-8 h-8 rounded-full border border-white/20"
											/>
										) : (
											<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border border-white/20">
												<User className="w-4 h-4 text-white" />
											</div>
										)}
										<span className="text-sm font-medium text-white">
											{user.firstName || user.username}
										</span>
									</div>
								</button>

								{/* User dropdown menu */}
								{isProfileOpen && (
									<div className="absolute right-0 mt-2 w-48 bg-[#111111] border border-white/10 rounded-lg shadow-lg py-1 z-10">
										<Link
											to="/dashboard"
											className="block px-4 py-2 text-sm text-white hover:bg-white/10"
											onClick={() => setIsProfileOpen(false)}
										>
											Dashboard
										</Link>
										<Link
											to="/dashboard/myblogs"
											className="block px-4 py-2 text-sm text-white hover:bg-white/10"
											onClick={() => setIsProfileOpen(false)}
										>
											My Blogs
										</Link>
										<Link
											to="/dashboard/bookmarks"
											className="block px-4 py-2 text-sm text-white hover:bg-white/10"
											onClick={() => setIsProfileOpen(false)}
										>
											Bookmarks
										</Link>
										<Link
											to="/user/sign-out"
											className="px-4 py-2 text-sm text-red-400 hover:bg-white/10 border-t border-white/10 mt-1 pt-1 flex items-center"
											onClick={() => setIsProfileOpen(false)}
										>
											<LogOut className="w-4 h-4 mr-2" /> Sign out
										</Link>
									</div>
								)}
							</div>
						) : (
							<div className="flex items-center space-x-4">
								<div className="text-white/80">

									<Dialog>
										<DialogTrigger asChild>
											<Button className="cursor-pointer underline bg-none font-semibold">
												Login
											</Button>
										</DialogTrigger>
										<DialogContent className="p-0 bg-transparent  max-w-[400px] border-none outline-none">
											<AuthCard mode="signin" />
											<DialogTitle />
										</DialogContent>
									</Dialog>
								</div>
								<div>

									<Dialog>
										<DialogTrigger asChild>
											<Button className="cursor-pointer bg-blue-600 hover:bg-slate-300/30 font-semibold">
												Get Started
											</Button>
										</DialogTrigger>
										<DialogContent className="p-0 bg-transparent  max-w-[400px] border-none  outline-none">
											<AuthCard mode="signup" />
											<DialogTitle />
										</DialogContent>
									</Dialog>
								</div>
							</div>
						)}
					</div>
					<div className="-mr-2 flex items-center md:hidden">
						<button
							onClick={toggleMenu}
							className="inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none"
						>
							<span className="sr-only">Open main menu</span>
							{isMenuOpen ? (
								<X className="block h-6 w-6" aria-hidden="true" />
							) : (
								<Menu className="block h-6 w-6" aria-hidden="true" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile menu, show/hide based on menu state */}
			<div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
				<div className="pt-2 pb-3 space-y-1">
					<Link
						to="/blog"
						className="text-white block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-white/5 hover:border-white/50"
						onClick={() => setIsMenuOpen(false)}
					>
						Explore
					</Link>
					<Link
						to="/blog?tag=Technology"
						className="text-white block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-white/5 hover:border-white/50"
						onClick={() => setIsMenuOpen(false)}
					>
						Technology
					</Link>
					<Link
						to="/blog?tag=Design"
						className="text-white block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-white/5 hover:border-white/50"
						onClick={() => setIsMenuOpen(false)}
					>
						Design
					</Link>
					<Link
						to="/blog?tag=Business"
						className="text-white block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-white/5 hover:border-white/50"
						onClick={() => setIsMenuOpen(false)}
					>
						Business
					</Link>
					<Link
						to="/team"
						className="text-white block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-white/5 hover:border-white/50"
						onClick={() => setIsMenuOpen(false)}
					>
						Team
					</Link>
				</div>
				<div className="pt-4 pb-3 border-t border-white/10">
					{isLoaded && user ? (
						<div className="space-y-2 px-4">
							<div className="flex items-center space-x-3 mb-3">
								{user.imageUrl ? (
									<img
										src={user.imageUrl}
										alt={user.firstName || user.username || "User"}
										className="w-8 h-8 rounded-full border border-white/20"
									/>
								) : (
									<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border border-white/20">
										<User className="w-4 h-4 text-white" />
									</div>
								)}
								<div>
									<div className="text-sm font-medium text-white">
										{user.firstName || user.username}
									</div>
									<div className="text-xs text-white/60">
										{user.emailAddresses[0]?.emailAddress}
									</div>
								</div>
							</div>

							<Link
								to="/dashboard"
								className="block px-3 py-2 rounded-lg text-white hover:bg-white/10 w-full text-sm"
								onClick={() => setIsMenuOpen(false)}
							>
								Dashboard
							</Link>
							<Link
								to="/dashboard/myblogs"
								className="block px-3 py-2 rounded-lg text-white hover:bg-white/10 w-full text-sm"
								onClick={() => setIsMenuOpen(false)}
							>
								My Blogs
							</Link>
							<Link
								to="/dashboard/bookmarks"
								className="block px-3 py-2 rounded-lg text-white hover:bg-white/10 w-full text-sm"
								onClick={() => setIsMenuOpen(false)}
							>
								Bookmarks
							</Link>
							<Link
								to="/user/sign-out"
								className="px-3 py-2 rounded-lg text-red-400 hover:bg-white/10 w-full text-sm mt-2 border-t border-white/10 pt-2 flex items-center"
								onClick={() => setIsMenuOpen(false)}
							>
								<LogOut className="w-4 h-4 mr-2" /> Sign out
							</Link>
						</div>
					) : (
						<div className="flex items-center px-4 space-x-3">
							<div className="text-white/80">
								<SignInButton mode="modal">
									<button
										className="w-full px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
										onClick={() => setIsMenuOpen(false)}
									>
										Sign in
									</button>
								</SignInButton>
							</div>
							<div className="flex-grow">
								<SignUpButton mode="modal">
									<button
										className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
										onClick={() => setIsMenuOpen(false)}
									>
										Get Started
									</button>
								</SignUpButton>
							</div>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
}
