import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { prisma } from "~/.server/db";
import BlogCard from "~/components/Blog";

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
	const { userId } = await getAuth(args);
	const blogs = await prisma.post.findMany({
		where: {
			authorId: userId?.toString() ?? "",
		},
		select: {
			id: true,
			tags: true,
			title: true,
			content: true,
			comments: true,
			likes: true,
			authorId: true,
			imgUrl: true,
			publishDate: true,
			authorImgUrl: true,
			author: {
				select: {
					name: true,
				},
			},
		},
	});
	return {
		status: "success",
		body: {
			blogs,
		},
	};
};

function stripHtml(html: string): string {
	// Check if we're in the browser environment
	if (typeof document !== "undefined") {
		const doc = new DOMParser().parseFromString(html, "text/html");
		return doc.body.textContent || "";
	}

	// Server-side fallback - simple regex to strip HTML tags
	return html.replace(/<[^>]*>?/gm, "");
}

const MyBlogs = () => {
	const { body } = useLoaderData<typeof loader>();
	const blogs: BlogData[] = body.blogs;
	if (!blogs[0]) {
		return (
			<div className="p-5 flex">
				you have no blogs published,
				<Link to={"/dashboard/blogs"} className="underline px-1 cursor-pointer">
					Write blogs
				</Link>
			</div>
		);
	}

	interface BlogData {
		title: string;
		content: string;
		authorId: number;
		publishDate: string;
		comments: [];
		imgUrl: string;
		authorImgUrl: string;
		likes: [];
		tags: string[];
		author: {
			name: string;
			id: number;
		};
		id: number;
	}

	return (
		<div className="mt-10 ">
			<h2 className="text-2xl font-bold">{"Your posts till now"}</h2>
			<div className="grid grid-cols-1 mt-10 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{blogs.map((b: BlogData) => (
					<div className="flex">
						<BlogCard
							deleteable={true}
							key={b.id}
							imgUrl={b.imgUrl}
							authorImgUrl={b.authorImgUrl}
							authorName={b.author.name || "Anonymous"}
							title={b.title}
							content={stripHtml(b.content).substring(0, 120)}
							tags={!b.tags ? ["notags"] : b.tags}
							publishDate={b.publishDate ? b.publishDate : "no trace"}
							likes={b.likes.length}
							likeCount={b.likes.length}
							comments={b.comments.length}
							authorId={b.authorId}
							id={Number(b.id)}
							bookmarked={true}
						/>
						<div
							className="bg-gradient-to-b from-[#111111] to-[#0c0c0c] rounded-xl overflow-hidden shadow-md border border-white/5 animate-pulse hidden hover:flex w-[100px] h-[50px]"
						>

						</div>
					</div>

				))}
			</div>
		</div>
	);
};
export default MyBlogs;
