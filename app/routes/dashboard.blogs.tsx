import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { format } from "date-fns";
import { prisma } from "~/.server/db";
import { Plus, Search, Filter, Bookmark } from "lucide-react";
import type { Post, User, Prisma } from "@prisma/client";
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
    blogs: PostWithAuthor[];
    pagination: {
      currentPage: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    searchQuery: string | null;
  };
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const url = new URL(args.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const searchQuery = url.searchParams.get("search");
  const limit = 9;
  const skip = (page - 1) * limit;

  try {
    // Build the where clause based on search query
    let whereClause: Prisma.PostWhereInput = {};

    if (searchQuery) {
      whereClause = {
        OR: [
          {
            title: {
              contains: searchQuery,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
          {
            content: {
              contains: searchQuery,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
          {
            tags: {
              has: searchQuery,
            },
          },
        ],
      };
    }

    const [totalPosts, posts] = await Promise.all([
      prisma.post.count({ where: whereClause }),
      prisma.post.findMany({
        where: whereClause,
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
        blogs: posts,
        pagination: {
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        searchQuery,
      },
    });
  } catch (error) {
    console.error("Error loading blogs:", error);
    return json<LoaderData>(
      {
        status: "error",
        body: {
          blogs: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
          searchQuery: null,
        },
      },
      { status: 500 }
    );
  }
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

export default function BlogsPage() {
  const { body } = useLoaderData<typeof loader>();
  const { blogs, pagination, searchQuery } = body;
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle local search form submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;

    if (search.trim()) {
      setSearchParams({ search: search.trim() });
    } else {
      // If search is empty, remove the search param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("search");
      setSearchParams(newParams);
    }
  };

  return (
    <div className="space-y-8 mt-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : "All Blogs"}
          </h1>
          <p className="text-gray-600 dark:text-white/60">
            {searchQuery
              ? `Found ${blogs.length} posts matching your search`
              : "Discover and explore amazing blog posts"}
          </p>
        </div>
        <Link
          to="/dashboard/blog/solo"
          className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Write a new blog</span>
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              name="search"
              placeholder="Search blogs..."
              defaultValue={searchQuery || ""}
              className="w-full px-4 py-3 pl-12 rounded-xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              type="submit"
              className="absolute left-4 top-1/2 -translate-y-1/2"
            >
              <Search className="w-5 h-5 text-gray-400 dark:text-white/40" />
            </button>
          </form>
        </div>
        <button className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <Filter className="w-5 h-5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <BlogCard
              key={blog.id}
              id={blog.id}
              title={blog.title}
              content={stripHtml(blog.content).substring(0, 120)}
              likes={blog._count.likes}
              comments={blog._count.comments}
              likeCount={23}
              authorName={blog.author.name ?? ""}
              authorImgUrl={blog.authorImgUrl}
              authorId={0}
              tags={blog.tags}
              publishDate={blog.publishDate}
              imgUrl={blog.imgUrl}
              bookmarked={true}
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-10">
            <p className="text-lg text-gray-600 dark:text-white/60">
              {searchQuery
                ? `No blogs found matching "${searchQuery}". Try a different search term.`
                : "No blogs found. Be the first to write one!"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Link
            to={`?page=${pagination.currentPage - 1}${
              searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
            }`}
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
            to={`?page=${pagination.currentPage + 1}${
              searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
            }`}
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
  );
}
