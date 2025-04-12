import { LoaderFunction, LoaderFunctionArgs, json } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { createClerkClient } from "@clerk/remix/api.server";
import { prisma } from "~/.server/db";
import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Redis } from '@upstash/redis'
import {
  ArrowRight,
  Calendar,
  Heart,
  MessageCircle,
  Tag as TagIcon,
} from "lucide-react";
import PublicNavbar from "~/components/PublicNavbar";
import PublicFooter from "~/components/PublicFooter";
import type { Post } from "@prisma/client";

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

export const meta: MetaFunction = () => {
  return [
    { title: "BlogStack - Your Personal Blogging Platform" },
    {
      name: "description",
      content:
        "Create, share, and discover amazing blog posts with BlogStack. Join our community of writers and readers.",
    },
    {
      property: "og:title",
      content: "BlogStack - Your Personal Blogging Platform",
    },
    {
      property: "og:description",
      content:
        "Create, share, and discover amazing blog posts with BlogStack. Join our community of writers and readers.",
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/logo.png" },
    { property: "og:image:width", content: "256" },
    { property: "og:image:height", content: "256" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "BlogStack - Your Personal Blogging Platform",
    },
    {
      name: "twitter:description",
      content:
        "Create, share, and discover amazing blog posts with BlogStack. Join our community of writers and readers.",
    },
    { name: "twitter:image", content: "/logo.png" },
  ];
};

const getRedisConfig = () => {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    return {
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN
    }
  }
  else {
    throw new Error("REDIS CREDENTIALS NOT FOUND!");
  }
}
const redis = new Redis(getRedisConfig())
export const loader: LoaderFunction = async (args) => {
  try {
    const { userId } = await getAuth(args);
    if (userId) {
      const user = await createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      }).users.getUser(userId);
      if (user) {
        const User = await prisma.user.findFirst({
          where: {
            identifier: user?.id.toString(),
          },
        });

        if (User?.id) {
          const updatedUser = await prisma.user.update({
            where: {
              identifier: user.id,
            },
            data: {
              email: user.emailAddresses[0].emailAddress.toString(),
            },
          });
          await redis.del(String(user.id))
          await redis.set(String(updatedUser.identifier), JSON.stringify(updatedUser))
        }

        if (!User?.id && user) {
          const newUser = await prisma.user.create({
            data: {
              identifier: user.id,
              email: user.emailAddresses[0].emailAddress.toString(),
              name: user.fullName,
              pfpUrl: user.imageUrl,
              fname: user.firstName,
              lname: user.lastName,
            },
          });
          await redis.set(String(newUser.identifier), JSON.stringify(newUser))
        }
      }
    }

    // Fetch featured blogs
    const featuredBlogs = await prisma.post.findMany({
      take: 6,
      orderBy: {
        publishDate: "desc",
      },
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
    });

    return json({ featuredBlogs });
  } catch (e) {
    console.error("error :(  " + e);
    return json({ featuredBlogs: [] });
  }
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Landing() {
  const { featuredBlogs } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <PublicNavbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                Share Your Story with the World
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
                Create, share, and discover amazing blog posts. Join our
                community of writers and readers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center ">
                <Link
                  to={"/blog"}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors z-10"
                >
                  Explore Blogs
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to={"/dashboard"}
                  className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors z-10"
                >
                  Start Writing
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Blogs Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Featured Blogs</h2>
            <Link
              to="/blog"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All
              <ArrowRight className="inline-block ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBlogs.map((blog: PostWithAuthor) => (
              <Link
                key={blog.id}
                to={`/blog/${blog.id}`}
                className="group bg-[#111111] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors"
              >
                <div className="aspect-video relative overflow-hidden">
                  {blog.imgUrl ? (
                    <img
                      src={blog.imgUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-white/80 px-4">
                          {blog.title}
                        </h3>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-white/60 mb-3">
                    <div className="flex items-center">
                      <img
                        src={
                          blog.author.pfpUrl || "https://via.placeholder.com/32"
                        }
                        alt={blog.author.name || "Author"}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <span>{blog.author.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatDate(blog.publishDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      <span>{blog._count.likes}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span>{blog._count.comments}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.slice(0, 3).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="flex items-center px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-lg"
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-[#111111] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Create Beautiful Posts
                </h3>
                <p className="text-white/60">
                  Write and format your content with our rich text editor
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Engage with Community
                </h3>
                <p className="text-white/60">
                  Connect with other writers and readers through comments and
                  likes
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Reach Global Audience
                </h3>
                <p className="text-white/60">
                  Share your thoughts with readers from around the world
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
