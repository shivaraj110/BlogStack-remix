import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import {
  ArrowLeft,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Tag as TagIcon,
  User as UserIcon,
  Eye,
} from "lucide-react";
import { prisma } from "~/.server/db";
import { useState } from "react";
import PublicNavbar from "~/components/PublicNavbar";
import PublicFooter from "~/components/PublicFooter";

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
  const id = Number(args.params["id"]);

  try {
    const blog = await prisma.post.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        tags: true,
        title: true,
        content: true,
        authorId: true,
        imgUrl: true,
        likes: true,
        publishDate: true,
        authorImgUrl: true,
        author: {
          select: {
            name: true,
          },
        },
        comments: {
          where: {
            postId: id,
          },
          orderBy: {
            commentedAt: "desc",
          },
          select: {
            comment: true,
            commentedAt: true,
            id: true,
            user: {
              select: {
                name: true,
                pfpUrl: true,
                id: true,
              },
            },
          },
        },
      },
    });

    // Get related posts
    const relatedPosts = await prisma.post.findMany({
      where: {
        id: {
          not: id,
        },
        tags: {
          hasSome: blog?.tags || [],
        },
      },
      take: 3,
      select: {
        id: true,
        title: true,
        imgUrl: true,
        publishDate: true,
        authorImgUrl: true,
        likes: true,
        tags: true,
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
        blog,
        relatedPosts,
      },
    };
  } catch (e) {
    return {
      status: "failure",
    };
  }
};

const PublicBlog = () => {
  const { body } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const blog: {
    id: number;
    title: string;
    content: string;
    authorId: string;
    authorImgUrl: string;
    publishDate: string;
    tags: string[];
    likes: [];
    imgUrl: string;
    author: {
      name: string;
    };
    comments: {
      comment: string;
      commentedAt: Date;
      id: number;
      user: {
        name: string;
        pfpUrl: string;
        id: number;
      };
    }[];
  } = body.blog;

  const relatedPosts = body.relatedPosts;

  // Break content into paragraphs
  const paragraphs = blog.content.split("\n\n");

  // Function to share the blog post
  const shareBlog = () => {
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: `Check out this blog post: ${blog.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <PublicNavbar />

      <div className="flex-grow pb-20">
        {/* Hero Section with Blog Image */}
        <div
          className="w-full h-[50vh] bg-center bg-cover relative"
          style={{ backgroundImage: `url(${blog.imgUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 to-[#0a0a0a]"></div>
          <div className="absolute bottom-0 left-0 w-full p-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-4xl">
              {blog.title}
            </h1>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center">
                <img
                  src={blog.authorImgUrl}
                  alt={blog.author.name}
                  className="w-10 h-10 rounded-full border border-white/20 mr-3"
                />
                <span className="text-white/90">{blog.author.name}</span>
              </div>
              <div className="text-white/70 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{blog.publishDate}</span>
              </div>
              <div className="text-white/70 flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                <span>{blog.likes.length} likes</span>
              </div>
              <div className="text-white/70 flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span>{blog.comments.length} comments</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
                {/* Article Content */}
                <div className="p-8">
                  <div
                    className="prose prose-lg prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                </div>

                {/* Tags */}
                <div className="mt-8 mb-6 flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/blog/tag/${tag}`}
                      className="flex items-center px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                    </Link>
                  ))}
                </div>

                {/* Action Bar */}
                <div className="border-t border-white/10 pt-6 mt-6 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Link
                      to={`/dashboard/fullblog/${blog.id}`}
                      className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors"
                    >
                      <Eye className="h-5 w-5" />
                      <span>Read in dashboard</span>
                    </Link>

                    <button
                      onClick={shareBlog}
                      className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors group"
                    >
                      <Share2 className="h-5 w-5 group-hover:text-blue-400" />
                      <span>Share</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <img
                      src={blog.authorImgUrl}
                      alt={blog.author.name}
                      className="w-10 h-10 rounded-full border border-white/10"
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {blog.author.name}
                      </div>
                      <div className="text-xs text-white/60">Author</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section Preview */}
              <div className="mt-8 bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-6">
                    Comments ({blog.comments.length})
                  </h3>

                  {/* Comment Login Prompt */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                    <p className="text-white/80 mb-2">
                      Join the conversation and share your thoughts on this
                      post.
                    </p>
                    <Link
                      to={`/dashboard/fullblog/${blog.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Sign in to comment
                    </Link>
                  </div>

                  {/* Comments List Preview */}
                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {blog.comments.length === 0 ? (
                      <div className="text-center p-8 text-white/50">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    ) : (
                      blog.comments.slice(0, 3).map((comment) => (
                        <div
                          key={comment.id}
                          className="border-b border-white/5 pb-6"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={
                                comment.user.pfpUrl ||
                                "https://via.placeholder.com/40"
                              }
                              alt={comment.user.name}
                              className="w-10 h-10 rounded-full border border-white/10"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {comment.user.name}
                                </span>
                                <span className="text-xs text-white/50">
                                  {new Date(
                                    comment.commentedAt
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <p className="text-white/80">{comment.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {blog.comments.length > 3 && (
                      <div className="text-center pt-2">
                        <Link
                          to={`/dashboard/fullblog/${blog.id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View all {blog.comments.length} comments
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Author Card */}
              <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">
                    About the Author
                  </h3>
                  <div className="flex items-center mb-4">
                    <img
                      src={blog.authorImgUrl}
                      alt={blog.author.name}
                      className="w-16 h-16 rounded-full border-2 border-blue-500 mr-4"
                    />
                    <div>
                      <h4 className="font-bold">{blog.author.name}</h4>
                      <p className="text-white/70 text-sm">Content Creator</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm mb-4">
                    Author of insightful articles and thought-provoking content.
                  </p>
                  <Link
                    to={`/dashboard`}
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    <UserIcon className="w-4 h-4 mr-1" />
                    Join BlogStack
                  </Link>
                </div>
              </div>

              {/* Related Posts */}
              {relatedPosts && relatedPosts.length > 0 && (
                <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">
                      Related Posts
                    </h3>
                    <div className="space-y-4">
                      {relatedPosts.map(
                        (post: {
                          id: number;
                          title: string;
                          imgUrl: string;
                          author: { name: string };
                          likes: any[];
                        }) => (
                          <Link
                            key={post.id}
                            to={`/blog/${post.id}`}
                            className="block group"
                          >
                            <div className="flex gap-3 items-start">
                              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={post.imgUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                                  {post.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                                  <span>{post.author.name}</span>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <Heart className="w-3 h-3 mr-1" />
                                    {post.likes.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Join Banner */}
              <div className="bg-blue-600 border border-blue-500 rounded-xl shadow-xl overflow-hidden mt-6">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">
                    Join BlogStack Community
                  </h3>
                  <p className="text-white/90 mb-4">
                    Create your own blog posts, engage with other writers, and
                    build your audience.
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-block w-full text-center bg-white text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default PublicBlog;
