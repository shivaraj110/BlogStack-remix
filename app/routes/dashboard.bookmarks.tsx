import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getBookmarks } from "~/.server/bookmark";
import { getLikes } from "~/.server/likes";
import BlogCard from "~/components/Blog";
import BookmarkedBlogPost from "~/components/BookMarkBlogs";
import { BookmarkedBlogData } from "~/types/BookMarkedBlogs";

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
	const { userId } = await getAuth(args);
	try {
		const blogs = await getBookmarks(userId ?? "");
		const likes = await getLikes(userId ?? "");
		let likedPosts: number[] = [];
		likes?.map((l) => [likedPosts.push(l.postId)]);
		return {
			status: "success",
			body: {
				blogs,
				likedPosts,
			},
		};
	} catch (e) {
		console.error(e);
		return {
			status: "fail",
		};
	}
};

export default function() {
	const { body } = useLoaderData<typeof loader>();
	const blogs: BookmarkedBlogData[] = body.blogs;
	const likedPosts: number[] = body.likedPosts;

	if (!body.blogs[0]) {
		return (
			<div className="p-5 flex">
				No Bookmarks yet! Be the first one to{" "}
				<Link to={"/dashboard/blogs"} className="underline px-1 cursor-pointer">
					add Bookmarks
				</Link>
				!
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 mt-10 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{blogs.map((b) => (
				<BlogCard
					authorId={b.post.authorId}
					comments={b.post.comments.length}
					likeCount={b.post.likes.length}
					key={b.post.id}
					imgUrl={b.post.imgUrl}
					authorImgUrl={b.post.authorImgUrl}
					authorName={b.post.authorName || "Anonymous"}
					title={b.post.title}
					content={b.post.content}
					tags={!b.post.tags ? ["notags"] : b.post.tags}
					publishDate={b.post.publishDate ? b.post.publishDate : "no trace"}
					likes={likedPosts.length}
					id={Number(b.post.id)}
					bookmarked={true}
				/>
			))}
		</div>
	);
}
