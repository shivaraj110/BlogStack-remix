import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { Calendar, Heart, MessageCircle, Search } from "lucide-react";
import { prisma } from "~/.server/db";
import PublicNavbar from "~/components/PublicNavbar";
import PublicFooter from "~/components/PublicFooter";
import { getAuth } from "@clerk/remix/ssr.server";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "BlogStack - Discover Amazing Blog Posts" },
    {
      name: "description",
      content:
        "Explore a diverse collection of blog posts from writers worldwide. Find articles on various topics, share your thoughts, and connect with the blogging community.",
    },
    {
      property: "og:title",
      content: "BlogStack - Discover Amazing Blog Posts",
    },
    {
      property: "og:description",
      content:
        "Explore a diverse collection of blog posts from writers worldwide. Find articles on various topics, share your thoughts, and connect with the blogging community.",
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/logo.png" },
    { property: "og:image:width", content: "256" },
    { property: "og:image:height", content: "256" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "BlogStack - Discover Amazing Blog Posts",
    },
    {
      name: "twitter:description",
      content:
        "Explore a diverse collection of blog posts from writers worldwide. Find articles on various topics, share your thoughts, and connect with the blogging community.",
    },
    { name: "twitter:image", content: "/logo.png" },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const url = new URL(args.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const searchTerm = url.searchParams.get("search") || "";
  const tag = url.searchParams.get("tag") || "";

  const ITEMS_PER_PAGE = 9;
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const { userId } = await getAuth(args);
  if (userId) {
    return redirect("/dashboard");
  }
  try {
    // Build the where clause based on search and tag
    const whereClause: any = {};

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { content: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (tag) {
      whereClause.tags = {
        has: tag,
      };
    }

    // Get the posts with pagination
    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: {
        publishDate: "desc",
      },
      skip,
      take: ITEMS_PER_PAGE,
      select: {
        id: true,
        title: true,
        content: true,
        imgUrl: true,
        publishDate: true,
        tags: true,
        author: {
          select: {
            name: true,
          },
        },
        likes: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Get total posts count for pagination
    const totalPosts = await prisma.post.count({
      where: whereClause,
    });

    // Get popular tags
    const allPosts = await prisma.post.findMany({
      select: {
        tags: true,
      },
    });

    // Count tag frequency
    const tagFrequency: { [key: string]: number } = {};
    allPosts.forEach((post) => {
      post.tags.forEach((tag) => {
        if (tagFrequency[tag]) {
          tagFrequency[tag]++;
        } else {
          tagFrequency[tag] = 1;
        }
      });
    });

    // Sort tags by frequency and get top 10
    const popularTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    return json({
      posts,
      totalPages: Math.ceil(totalPosts / ITEMS_PER_PAGE),
      currentPage: page,
      totalPosts,
      popularTags,
      searchTerm,
      activeTag: tag,
    });
  } catch (error) {
    console.error("Error loading blogs:", error);
    return json({
      posts: [],
      totalPages: 0,
      currentPage: 1,
      totalPosts: 0,
      popularTags: [],
      searchTerm: "",
      activeTag: "",
    });
  }
}

export default function BlogIndex() {
  const {
    posts,
    totalPages,
    currentPage,
    totalPosts,
    popularTags,
    searchTerm,
    activeTag,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    // Strip HTML tags
    const plainText =
      typeof document !== "undefined"
        ? new DOMParser().parseFromString(text, "text/html").body.textContent ||
          ""
        : text.replace(/<[^>]*>?/gm, "");

    if (plainText.length <= maxLength) return plainText;
    return plainText.slice(0, maxLength) + "...";
  };

  // Function to handle search form submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;

    const newParams = new URLSearchParams(searchParams);
    if (search) {
      newParams.set("search", search);
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1"); // Reset to first page on new search
    setSearchParams(newParams);
  };

  // Function to handle tag selection
  const handleTagSelect = (tag: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tag === activeTag) {
      newParams.delete("tag");
    } else {
      newParams.set("tag", tag);
    }
    newParams.set("page", "1"); // Reset to first page on tag selection
    setSearchParams(newParams);
  };

  // Function to handle pagination
  const changePage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 flex flex-col">
      <PublicNavbar />

      <div className="flex-grow">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">BlogStack</h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Discover thoughtful articles, stories, and insights from writers
              across the globe
            </p>
            <div className="max-w-xl mx-auto">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-white/60" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search blog posts..."
                    defaultValue={searchTerm}
                    className="w-full py-3 pl-12 pr-4 bg-white/10 border border-white/20 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-white/60"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-white text-blue-700 px-6 font-medium rounded-r-lg hover:bg-white/90 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Tags Filter */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Popular Topics</h2>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagSelect(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTag === tag
                      ? "bg-blue-600 text-white"
                      : "bg-[#111111] text-white/80 hover:bg-[#1a1a1a]"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {activeTag && (
                <button
                  onClick={() => handleTagSelect(activeTag)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {searchTerm || activeTag ? "Search Results" : "Latest Posts"}
              <span className="text-lg font-normal text-white/60 ml-2">
                ({totalPosts} {totalPosts === 1 ? "post" : "posts"})
              </span>
            </h2>

            {(searchTerm || activeTag) && (
              <div className="text-sm text-white/70">
                {searchTerm && <span>Search: "{searchTerm}" </span>}
                {activeTag && <span>Tag: {activeTag}</span>}
              </div>
            )}
          </div>

          {/* Blog Grid */}
          {posts.length === 0 ? (
            <div className="bg-[#111111] rounded-xl p-12 text-center">
              <h3 className="text-xl font-medium mb-2">No posts found</h3>
              <p className="text-white/70 mb-6">
                Try a different search term or browse all posts.
              </p>
              <Link
                to="/blog"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Posts
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden hover:shadow-lg hover:border-white/10 transition group"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.imgUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-white/10 text-white/60 rounded">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-4">
                      {truncateText(post.content, 120)}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-sm text-white/60">
                        {post.author.name}
                      </span>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(post.publishDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <span className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes.length}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post._count.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? "bg-[#111111] text-white/40 cursor-not-allowed"
                      : "bg-[#111111] text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;

                  // Logic to show correct page numbers when there are many pages
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => changePage(pageNum)}
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-[#111111] text-white hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "bg-[#111111] text-white/40 cursor-not-allowed"
                      : "bg-[#111111] text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 py-16 px-4 mt-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-white/90 mb-8 text-lg">
              Create your own blog posts, engage with other writers, and build
              your audience on BlogStack.
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-8 py-3 bg-white text-blue-700 font-bold rounded-lg hover:bg-white/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
