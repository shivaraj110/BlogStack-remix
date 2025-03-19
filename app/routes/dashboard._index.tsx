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

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 6;
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
    <div className="space-y-8 mt-10">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] rounded-3xl p-8 text-white border border-white/5">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Welcome back,{" "}
          <span className="text-blue-400">
            {user?.firstName || user?.username}
          </span>
          !
        </h1>
        <p className="text-lg text-white/90 mb-6">
          Discover the latest insights and share your knowledge with the
          community.
        </p>
        <Link
          to="/dashboard/blog/solo"
          className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Write a new blog</span>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to={"/dashboard/myblogs"}>
          <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-white/5">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  Your Posts
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posts}
                </h3>
              </div>
            </div>
          </div>
        </Link>

        <Link to={"/dashboard/bookmarks"}>
          <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-white/5">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Bookmark className="w-6 h-6 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  Saved Posts
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {bookmarks}
                </h3>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-white/5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-white/60">
                Member Since
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {format(new Date(joinedOn), "MMM yyyy")}
              </h3>
            </div>
          </div>
        </div>
      </div>
      {/* Recent Blogs Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Blogs
          </h2>
          <Link
            to="/dashboard/blogs"
            className="text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <a href={`/dashboard/fullblog/${blog.id}`} key={blog.id}>
              <article
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
                            blog.author.pfpUrl ||
                            "https://via.placeholder.com/32"
                          }
                          alt={blog.author.name || "Anonymous"}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{blog.author.name || "Anonymous"}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>
                          {format(new Date(blog.publishDate), "MMM d")}
                        </span>
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
                          {blog._count.likes}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-white/60">
                          likes
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {blog._count.comments}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-white/60">
                          comments
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/dashboard/fullblog/${blog.id}`}
                      className="text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    >
                      Read more →
                    </Link>
                  </div>
                </div>
              </article>
            </a>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <Link
              to={`?page=${pagination.currentPage - 1}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pagination.hasPrevPage
                  ? "bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5"
                  : "bg-white dark:bg-[#0a0a0a] text-gray-400 dark:text-white/40 cursor-not-allowed border border-gray-200 dark:border-white/5"
              }`}
              onClick={(e) => !pagination.hasPrevPage && e.preventDefault()}
            >
              Previous
            </Link>
            <span className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Link
              to={`?page=${pagination.currentPage + 1}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pagination.hasNextPage
                  ? "bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5"
                  : "bg-white dark:bg-[#0a0a0a] text-gray-400 dark:text-white/40 cursor-not-allowed border border-gray-200 dark:border-white/5"
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
