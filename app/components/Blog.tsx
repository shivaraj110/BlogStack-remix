import { Link } from "@remix-run/react";
import { format } from "date-fns";
import { Bookmark } from "lucide-react";
import { BlogData } from "~/types/BlogData";
const BlogCard = (blog: BlogData) => {
	return <article
		key={blog.id}
		className="group bg-white dark:bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-white/5"
	>
		<div className="relative h-48 overflow-hidden">
			<img
				src={
					blog.imgUrl ||
					"https://images.unsplash.com/photo-1461749280684-dccba630be2e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
				}
				alt={blog.title}
				className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
			/>
			<div className="absolute top-4 left-4">
				<span className="px-3 py-1 bg-blue-500/90 text-white text-sm rounded-full">
					{blog.tags[0] || "Technology"}
				</span>
			</div>
		</div>
		<div className="p-6">
			<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
				{blog.title}
			</h2>
			<p className="text-gray-600 dark:text-white/60 text-sm mb-4 line-clamp-2">
				{blog.content}
			</p>
			<div className="flex items-center justify-between text-sm text-gray-500 dark:text-white/60 mb-4">
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-1">
						<img
							src={
								blog.authorImgUrl || "https://via.placeholder.com/32"
							}
							alt={blog.authorName || "Anonymous"}
							className="w-6 h-6 rounded-full"
						/>
						<span>{blog.authorName || "Anonymous"}</span>
					</div>
					<div className="flex items-center space-x-1">
						<span>{format(new Date(blog.publishDate), "MMM d")}</span>
					</div>
				</div>
				<button className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
					<Bookmark className="w-4 h-4" />
				</button>
			</div>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-1">
						<span className="text-sm font-medium text-gray-900 dark:text-white">
							{blog.likes}
						</span>
						<span className="text-sm text-gray-500 dark:text-white/60">
							likes
						</span>
					</div>
					<div className="flex items-center space-x-1">
						<span className="text-sm font-medium text-gray-900 dark:text-white">
							{blog.comments}
						</span>
						<span className="text-sm text-gray-500 dark:text-white/60">
							comments
						</span>
					</div>
				</div>
				<Link
					to={`dashboard/fullblog/${blog.id}`}
					className="text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
				>
					Read more →
				</Link>
			</div>
		</div>
	</article>

}
export default BlogCard
