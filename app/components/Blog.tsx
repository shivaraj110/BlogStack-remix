import { Link } from "@remix-run/react";
import { format } from "date-fns";
import {
  Bookmark,
  Image as ImageIcon,
  MessageCircle,
  Heart,
} from "lucide-react";
import { BlogData } from "~/types/BlogData";
import { useState } from "react";

// Function to strip HTML tags from content
function stripHtml(html: string): string {
  // Check if we're in the browser environment
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  // Server-side fallback - simple regex to strip HTML tags
  return html.replace(/<[^>]*>?/gm, "");
}

const BlogCard = (blog: BlogData) => {
  // Strip HTML and limit preview length
  const contentPreview = stripHtml(blog.content).substring(0, 120);
  const [imageError, setImageError] = useState(false);

  return (
    <article className="group bg-[#111111] rounded-xl overflow-hidden shadow border border-white/5 hover:border-blue-500/10 hover:shadow-lg transition-all duration-300">
      <div className="relative h-40 sm:h-48 overflow-hidden">
        {blog.imgUrl && !imageError ? (
          <img
            src={blog.imgUrl}
            alt={blog.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-white/60 px-4 truncate max-w-full">
                {blog.title}
              </p>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs bg-blue-500/90 text-white rounded-full">
            {blog.tags[0] || "Technology"}
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
          {blog.title}
        </h2>
        <p className="text-white/60 text-xs sm:text-sm mb-3 line-clamp-2">
          {contentPreview}
        </p>

        {/* Author and date */}
        <div className="flex items-center text-xs text-white/60 mb-3">
          <img
            src={blog.authorImgUrl || "https://via.placeholder.com/32"}
            alt={blog.authorName || "Anonymous"}
            className="w-5 h-5 rounded-full mr-2"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/32";
            }}
          />
          <span className="mr-3">{blog.authorName || "Anonymous"}</span>
          <span>{format(new Date(blog.publishDate), "MMM d")}</span>
        </div>

        {/* Stats and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-white/60 text-xs">
              <Heart className="w-3 h-3 mr-1" />
              <span>{blog.likes}</span>
            </div>
            <div className="flex items-center text-white/60 text-xs">
              <MessageCircle className="w-3 h-3 mr-1" />
              <span>{blog.comments}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors">
              <Bookmark
                className={`w-3.5 h-3.5 text-blue-400 ${
                  blog.bookmarked ? "fill-current" : ""
                }`}
              />
            </button>
            <Link
              to={`/dashboard/fullblog/${blog.id}`}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Read →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
