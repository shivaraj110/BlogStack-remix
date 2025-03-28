import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { format } from "date-fns";
import { prisma } from "~/.server/db";
import { Plus, TrendingUp, Bookmark, Clock } from "lucide-react";
import type { Post, User } from "@prisma/client";
import { useUser } from "@clerk/remix";
import BlogCard from "~/components/Blog";

interface PostWithAuthor extends Post {
  author: {
    name: string | null;
    pfpUrl: string | null;
  };
  _count: {
    likes: number;
    comments: number;
    views: number;
  };
}

interface LoaderData {
  status: string;
  body: {
    posts: number;
    bookmarks: number;
    joinedOn: Date;
    blogs: PostWithAuthor[];
    pagination: {
      currentPage: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

function stripHtml(html: string): string {
  // Check if we're in the browser environment
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  // Server-side fallback - simple regex to strip HTML tags
  return html.replace(/<[^>]*>?/gm, "");
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 8;
  const skip = (page - 1) * limit;

  try {
    const [currUser, totalPosts, posts] = await Promise.all([
      prisma.user.findFirst({
        where: { identifier: userId ?? "" },
        select: {
          posts: true,
          bookmarks: true,
          joinedOn: true,
        },
      }),
      prisma.post.count(),
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { publishDate: "desc" },
        include: {
          author: {
            select: {
              name: true,
              pfpUrl: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              views: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    return json<LoaderData>({
      status: "success",
      body: {
        posts: currUser?.posts?.length ?? 0,
        bookmarks: currUser?.bookmarks?.length ?? 0,
        joinedOn: currUser?.joinedOn ?? new Date(),
        blogs: posts,
        pagination: {
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return json<LoaderData>(
      {
        status: "error",
        body: {
          posts: 0,
          bookmarks: 0,
          joinedOn: new Date(),
          blogs: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      },
      { status: 500 }
    );
  }
};

export default function DashboardPage() {
  const { user } = useUser();
  const { body } = useLoaderData<typeof loader>();
  const { posts, bookmarks, joinedOn, blogs, pagination } = body;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] rounded-2xl p-6 md:p-8 text-white border border-white/5">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
          Welcome back,{" "}
          <span className="text-blue-400">
            {user?.firstName || user?.username}
          </span>
          !
        </h1>
        <p className="text-base md:text-lg text-white/90 mb-5 md:mb-6">
          Discover the latest insights and share your knowledge with the
          community.
        </p>
        <Link
          to="/dashboard/blog/solo"
          className="inline-flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>Write a new blog</span>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Link to="/dashboard/myblogs" className="block">
          <div className="bg-[#111111] p-5 md:p-6 rounded-xl shadow border border-white/5 hover:border-blue-500/30 hover:bg-[#131313] transition-all">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Your Posts</p>
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {posts}
                </h3>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/bookmarks" className="block">
          <div className="bg-[#111111] p-5 md:p-6 rounded-xl shadow border border-white/5 hover:border-green-500/30 hover:bg-[#131313] transition-all">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Bookmark className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Saved Posts</p>
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {bookmarks}
                </h3>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-[#111111] p-5 md:p-6 rounded-xl shadow border border-white/5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Member Since</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                {format(new Date(joinedOn), "MMM yyyy")}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Blogs Section */}
      <div>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Recent Blogs
          </h2>
          <Link
            to="/dashboard/blogs"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center"
          >
            View all <span className="ml-1">→</span>
          </Link>
        </div>

        {blogs.length === 0 ? (
          <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden shadow-lg">
            <div className="px-6 py-12 md:py-16 flex flex-col items-center text-center">
              <div className="w-32 h-32 md:w-40 md:h-40 mb-6 md:mb-8 relative">
                <div
                  className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse"
                  style={{ animationDuration: "3s" }}
                ></div>
                <div
                  className="absolute inset-4 bg-blue-500/30 rounded-full animate-pulse"
                  style={{ animationDuration: "4s", animationDelay: "0.3s" }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M8 13h2"></path>
                    <path d="M8 17h2"></path>
                    <path d="M14 13h2"></path>
                    <path d="M14 17h2"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                No blogs to show yet
              </h3>
              <p className="text-white/70 max-w-md mb-8 text-sm md:text-base">
                It seems like there are no published blogs at the moment. Be the
                first to share your thoughts and insights with the community!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/dashboard/blog/solo"
                  className="inline-flex items-center justify-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Write your first blog</span>
                </Link>
                <Link
                  to="/blog"
                  className="inline-flex items-center justify-center space-x-2 bg-white/5 text-white border border-white/10 px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors"
                >
                  <span>Explore public blogs</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                title={blog.title}
                content={blog.content}
                likes={blog._count.likes}
                comments={blog._count.comments}
                likeCount={blog._count.likes}
                views={blog._count.views}
                authorName={blog.author.name || "Anonymous"}
                authorImgUrl={blog.author.pfpUrl || ""}
                authorId={0}
                tags={blog.tags}
                publishDate={blog.publishDate}
                imgUrl={blog.imgUrl}
                bookmarked={false}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {blogs.length > 0 && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6 md:mt-8">
            <Link
              to={`?page=${pagination.currentPage - 1}`}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium transition-colors ${
                pagination.hasPrevPage
                  ? "bg-[#111111] text-white hover:bg-[#1a1a1a] border border-white/10"
                  : "bg-[#111111] text-white/40 cursor-not-allowed border border-white/5"
              }`}
              onClick={(e) => !pagination.hasPrevPage && e.preventDefault()}
            >
              Previous
            </Link>
            <span className="px-3 py-2 md:px-4 md:py-2 text-sm font-medium text-white">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Link
              to={`?page=${pagination.currentPage + 1}`}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm font-medium transition-colors ${
                pagination.hasNextPage
                  ? "bg-[#111111] text-white hover:bg-[#1a1a1a] border border-white/10"
                  : "bg-[#111111] text-white/40 cursor-not-allowed border border-white/5"
              }`}
              onClick={(e) => !pagination.hasNextPage && e.preventDefault()}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
