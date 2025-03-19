import { useUser } from "@clerk/remix";
import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Heart,
  MessageCircle,
  SendHorizontal,
  Share2,
  Tag as TagIcon,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getBookmarks } from "~/.server/bookmark";
import { prisma } from "~/.server/db";
import { getLikes } from "~/.server/likes";
import { format } from "date-fns";

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
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

    const bookmarks = await getBookmarks(userId ?? "");
    const Likes = await getLikes(userId ?? "");
    let bookMarkPostIds: number[] = [];
    let likedPosts: number[] = [];
    bookmarks?.map((b) => [bookMarkPostIds.push(b.postId)]);
    Likes?.map((l) => [likedPosts.push(l.postId)]);

    return {
      status: "success",
      body: {
        blog,
        bookMarkPostIds,
        likedPosts,
        relatedPosts,
      },
    };
  } catch (e) {
    return {
      status: "failure",
    };
  }
};

const FullBlog = () => {
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
  const bookmarks: number[] = body.bookMarkPostIds;
  const likedPosts: number[] = body.likedPosts;

  const BookMarked = () => {
    let val = false;
    bookmarks.map((b) => {
      if (b === blog.id) {
        val = true;
      }
    });
    return val;
  };

  const Liked = () => {
    let val = false;
    likedPosts.map((l) => {
      if (l === blog.id) {
        val = true;
      }
    });
    return val;
  };

  const { user } = useUser();
  const [isLiked, setIsLiked] = useState<boolean>(Liked());
  const [comment, setComment] = useState<string>("");
  // Break content into paragraphs
  const paragraphs = blog.content.split("\n\n");
  const fetcher = useFetcher();
  const [isBookmarked, setIsBookmarked] = useState(BookMarked);

  useEffect(() => {
    setIsLiked(Liked());
    setIsBookmarked(BookMarked());
  }, [Liked(), BookMarked()]);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
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
          <div className="flex items-center space-x-4 mb-6">
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
                    to={`/dashboard/blog/${tag}`}
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
                  <fetcher.Form
                    className="flex"
                    method={isLiked ? "DELETE" : "POST"}
                    action={isLiked ? "/api/removelike" : "/api/addlike"}
                  >
                    <input type="hidden" name="postId" value={blog.id} />
                    <input type="hidden" name="userId" value={user?.id ?? ""} />
                    <button
                      type="submit"
                      onClick={() => setIsLiked(!isLiked)}
                      className="flex items-center space-x-1 group"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isLiked
                            ? "fill-current text-red-500"
                            : "text-white/70 group-hover:text-red-500"
                        } transition-colors duration-200`}
                      />
                      <span
                        className={isLiked ? "text-red-500" : "text-white/70"}
                      >
                        {blog.likes.length}
                      </span>
                    </button>
                  </fetcher.Form>

                  <fetcher.Form
                    className="flex"
                    method={isBookmarked ? "DELETE" : "POST"}
                    action={isBookmarked ? "/removebookmarks" : "/addbookmark"}
                  >
                    <input type="hidden" name="userId" value={user?.id ?? ""} />
                    <button
                      onClick={() => {
                        setTimeout(() => {
                          setIsBookmarked(!isBookmarked);
                        }, 100);
                      }}
                      type="submit"
                      name="postId"
                      value={blog.id}
                      className="flex items-center space-x-1 group"
                    >
                      <Bookmark
                        className={`h-5 w-5 ${
                          isBookmarked
                            ? "fill-current text-blue-500"
                            : "text-white/70 group-hover:text-blue-500"
                        } transition-colors duration-200`}
                      />
                      <span
                        className={
                          isBookmarked ? "text-blue-500" : "text-white/70"
                        }
                      >
                        Save
                      </span>
                    </button>
                  </fetcher.Form>

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

            {/* Comments Section */}
            <div className="mt-8 bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-6">
                  Comments ({blog.comments.length})
                </h3>

                {/* Add Comment */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={user?.imageUrl || "https://via.placeholder.com/40"}
                      alt="Your profile"
                      className="w-10 h-10 rounded-full border border-white/10"
                    />
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full p-3 pr-12 bg-[#0a0a0a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-white/40 text-white"
                        />
                        <fetcher.Form
                          method="POST"
                          action={comment !== "" ? "/api/pushcomment" : ""}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          <input type="hidden" name="postId" value={blog.id} />
                          <input type="hidden" name="comment" value={comment} />
                          <button
                            type="submit"
                            disabled={!comment}
                            onClick={() =>
                              setTimeout(() => setComment(""), 100)
                            }
                            className={`p-1 rounded-full ${
                              comment
                                ? "text-blue-500 hover:bg-white/5"
                                : "text-white/30"
                            } transition-colors`}
                          >
                            <SendHorizontal className="w-5 h-5" />
                          </button>
                        </fetcher.Form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {blog.comments.length === 0 ? (
                    <div className="text-center p-8 text-white/50">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Be the first to comment on this post!</p>
                    </div>
                  ) : (
                    blog.comments.map((comment) => (
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
                  to={`/dashboard/profile/${blog.authorId}`}
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  <UserIcon className="w-4 h-4 mr-1" />
                  View Profile
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
                          to={`/dashboard/fullblog/${post.id}`}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullBlog;
