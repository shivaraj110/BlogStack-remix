import { useUser } from "@clerk/remix";
import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { Redis } from "@upstash/redis";
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
  Image as ImageIcon,
  Trash2,
  EyeIcon,
  Pencil,
  Reply as ReplyIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getBookmarks } from "~/.server/bookmark";
import { prisma } from "~/.server/db";
import { getLikes } from "~/.server/likes";
import { getRedisConfig } from "~/lib/url";

// Add new interfaces for our comment types
interface CommentUser {
  name: string;
  pfpUrl: string | null;
  identifier: string;
}

interface Reply {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: CommentUser;
  replies?: Reply[];
  parentId?: number;
}

interface Comment {
  id: number;
  comment: string;
  commentedAt: Date;
  updatedAt: Date;
  userId: string;
  user: CommentUser;
  replies: Reply[];
}

interface FetcherResponse {
  status: string;
  message?: string;
  comments?: Comment[];
}

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
  const { userId } = (await getAuth(args)) ?? "";
  const id = Number(args.params["id"]);
  const redis = new Redis(getRedisConfig())
  try {
    let blog;
    blog = await redis.get(JSON.stringify({ blogId: id }))
    if (blog)
      blog = JSON.stringify(blog)

    blog = await prisma.post.findUnique({
      where: {
        id: Number(args.params.id),
      },
      include: {
        author: {
          select: {
            name: true,
            pfpUrl: true,
            email: true,
            identifier: true,
            openToCollab: true,
          },
        },
        likes: true,
        views: true,
        comments: {
          orderBy: {
            commentedAt: "desc",
          },
          include: {
            user: true,
            replies: {
              include: {
                user: true,
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
        views: true,
        tags: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    //update views
    const isViewed = await prisma.view.findFirst({
      where: {
        userId: userId?.toString() ?? "",

        postId: id,
      },
    });

    if (!isViewed?.id) {
      await prisma.view.create({
        data: {
          userId: userId?.toString() ?? "",
          postId: id,
        },
      });
    }

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
    redirect("/dashboard");
    return {
      status: "failure",
    };
  }
};

const FullBlog = () => {
  const { body } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingToReply, setReplyingToReply] = useState<{
    id: number;
    parentId?: number;
  } | null>(null);

  const blog: {
    id: number;
    title: string;
    content: string;
    authorId: string;
    authorImgUrl: string;
    publishDate: string;
    tags: string[];
    likes: [];
    views: [];
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
  const [replyText, setReplyText] = useState<string>("");
  const [editText, setEditText] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const fetcher = useFetcher<FetcherResponse>();
  const [isBookmarked, setIsBookmarked] = useState(BookMarked);
  const deleteFetcher = useFetcher<FetcherResponse>();
  const replyFetcher = useFetcher<FetcherResponse>();
  const editFetcher = useFetcher<FetcherResponse>();
  useEffect(() => {
    setIsLiked(Liked());
    setIsBookmarked(BookMarked());
    // Scroll to top when blog loads
    window.scrollTo(0, 0);
  }, [blog.id, Liked(), BookMarked()]);

  useEffect(() => {
    if (body.blog.comments) {
      setComments(body.blog.comments);
    }
  }, [body.blog.comments]);

  // Format date for better display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

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

  // Function to handle starting a reply
  const handleReply = (commentId: number) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setEditingComment(null);
    setReplyText("");
  };

  // Function to handle editing a comment
  const handleEdit = (commentId: number, commentText: string) => {
    setEditingComment(editingComment === commentId ? null : commentId);
    setReplyingTo(null);
    setEditText(commentText);
  };

  // Function to handle deleting a comment
  const handleDelete = (commentId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this comment? All replies will also be deleted."
      )
    ) {
      deleteFetcher.submit(
        { commentId: commentId.toString() },
        { method: "post", action: "/api/deletecomment" }
      );
    }
  };

  // Function to submit a reply
  const submitReply = (commentId: number) => {
    if (replyText.trim() === "") return;

    replyFetcher.submit(
      {
        commentId: commentId.toString(),
        content: replyText,
      },
      { method: "post", action: "/api/addreply" }
    );
    setReplyText("");
    setReplyingTo(null);
  };

  // Function to submit an edit
  const submitEdit = (commentId: number) => {
    if (editText.trim() === "") return;

    editFetcher.submit(
      {
        commentId: commentId.toString(),
        comment: editText,
      },
      { method: "post", action: "/api/editcomment" }
    );
    setEditText("");
    setEditingComment(null);
  };

  // Function to add a reply
  const addReply = async (
    parentId: number,
    replyText: string,
    parentReplyId?: number
  ) => {
    if (!replyText.trim()) return;

    try {
      replyFetcher.submit(
        {
          commentId: parentId.toString(),
          content: replyText,
          parentReplyId: parentReplyId?.toString(),
        } as any,
        {
          method: "post",
          action: "/api/addreply",
        }
      );

      // Optimistically update the UI
      const newReply = {
        id: Date.now(), // Temporary ID until page refresh
        content: replyText,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          name: user?.fullName || "",
          pfpUrl: user?.imageUrl || "",
          identifier: user?.id || "",
        },
        replies: [],
        parentId: parentReplyId,
      };

      setComments((prevComments) => {
        return prevComments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [newReply, ...comment.replies],
            };
          }
          return comment;
        });
      });

      setReplyText("");
      setReplyingTo(null);
      setReplyingToReply(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  // Function to add a new comment
  const addComment = async (commentText: string) => {
    if (!commentText.trim()) return;

    try {
      fetcher.submit(
        {
          postId: blog.id.toString(),
          comment: commentText,
        } as any,
        {
          method: "post",
          action: "/api/pushcomment",
        }
      );

      // Optimistically update the UI
      const newComment = {
        id: Date.now(), // Temporary ID until page refresh
        comment: commentText,
        commentedAt: new Date(),
        updatedAt: new Date(),
        userId: user?.id || "",
        user: {
          name: user?.fullName || "",
          pfpUrl: user?.imageUrl || "",
          identifier: user?.id || "",
        },
        replies: [],
      };
      setComments((prevComments) => [newComment, ...prevComments]);
      setComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Update useEffect to handle fetcher states
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.status === "success") {
      // Refresh comments from the server
      const updatedComments = fetcher.data.comments;
      if (updatedComments) {
        setComments(updatedComments);
      }
    }

    if (
      replyFetcher.state === "idle" &&
      replyFetcher.data?.status === "success"
    ) {
      // Refresh comments from the server
      const updatedComments = replyFetcher.data.comments;
      if (updatedComments) {
        setComments(updatedComments);
      }
    }

    if (
      deleteFetcher.state === "idle" &&
      deleteFetcher.data?.status === "success"
    ) {
      // Refresh comments from the server
      const updatedComments = deleteFetcher.data.comments;
      if (updatedComments) {
        setComments(updatedComments);
      }
    }

    if (
      editFetcher.state === "idle" &&
      editFetcher.data?.status === "success"
    ) {
      // Refresh comments from the server
      const updatedComments = editFetcher.data.comments;
      if (updatedComments) {
        setComments(updatedComments);
      }
    }
  }, [
    fetcher.state,
    replyFetcher.state,
    deleteFetcher.state,
    editFetcher.state,
  ]);

  // Function to render nested replies
  const renderReplies = (replies: Reply[], parentId: number) => {
    return replies.map((reply: Reply) => (
      <div key={reply.id} className="pt-2 pl-4 border-l border-white/10">
        <div className="flex items-start gap-2">
          <img
            src={reply.user.pfpUrl || "https://via.placeholder.com/30"}
            alt={reply.user.name}
            className="w-6 h-6 rounded-full border border-white/10"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/30";
            }}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">{reply.user.name}</span>
                <span className="text-[10px] text-white/50">
                  {new Date(reply.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {user?.id === reply.user.identifier && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDelete(reply.id)}
                    className="text-white/60 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-white/80 text-xs">{reply.content}</p>

            {/* Reply to reply button */}
            <button
              onClick={() =>
                setReplyingToReply({ id: parentId, parentId: reply.id })
              }
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <ReplyIcon className="w-3 h-3" />
              Reply
            </button>

            {/* Reply to reply form */}
            {replyingToReply?.parentId === reply.id && (
              <div className="mt-3 pl-3">
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && replyText !== "") {
                        addReply(parentId, replyText, reply.id);
                      }
                    }}
                    className="flex-1 p-2 bg-[#0a0a0a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-xs"
                    placeholder="Write a reply..."
                  />
                  <button
                    onClick={() => addReply(parentId, replyText, reply.id)}
                    disabled={!replyText.trim()}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyingToReply(null)}
                    className="px-2 py-1 bg-[#333] text-white rounded text-xs hover:bg-[#444] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {reply.replies && reply.replies.length > 0 && (
              <div className="mt-2">
                {renderReplies(reply.replies, parentId)}
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  };

  // Update the comment input handler
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addComment(comment);
  };

  return (
    <div className="min-h-screen text-white pb-6 md:pb-10">
      {/* Hero Section with Blog Image */}
      <div className="w-full h-[30vh] sm:h-[40vh] md:h-[50vh] relative rounded-xl overflow-hidden">
        {blog.imgUrl && !imageError ? (
          <img
            src={blog.imgUrl}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl text-white/80 px-4 max-w-md mx-auto">
                {blog.title}
              </h2>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 to-[#0a0a0a]"></div>
        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 md:p-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 max-w-4xl">
            {blog.title}
          </h1>
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 items-center">
            <div className="flex items-center">
              <img
                src={blog.authorImgUrl}
                alt={blog.author.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 mr-2 sm:mr-3"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/40";
                }}
              />
              <span className="text-white/90 text-sm sm:text-base">
                {blog.author.name}
              </span>
            </div>
            <div className="text-white/70 flex items-center text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span>{formatDate(blog.publishDate)}</span>
            </div>
            <div className="text-white/70 flex items-center text-xs sm:text-sm">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span>{blog.likes.length} likes</span>
            </div>
            <div className="text-white/70 flex items-center text-xs sm:text-sm">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span>{blog.comments.length} comments</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
              {/* Article Content */}
              <div className="p-4 sm:p-6 md:p-8">
                <div
                  className="prose prose-lg prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </div>

              {/* Tags */}
              <div className="mt-6 mb-4 px-4 sm:px-6 md:px-8 flex flex-wrap gap-2">
                {blog.tags.map((tag, index) => (
                  <Link
                    key={index}
                    to={`/dashboard/blog/${tag}`}
                    className="flex items-center px-2 py-1 text-xs sm:text-sm bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Action Bar */}
              <div className="border-t border-white/10 px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-wrap justify-between items-center gap-4">
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
                        className={`h-4 sm:h-5 sm:w-5 ${isLiked
                          ? "fill-current text-red-500"
                          : "text-white/70 group-hover:text-red-500"
                          } transition-colors duration-200`}
                      />
                      <span
                        className={`text-xs sm:text-sm ${isLiked ? "text-red-500" : "text-white/70"
                          }`}
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
                        className={`h-4 sm:h-5 sm:w-5 ${isBookmarked
                          ? "fill-current text-blue-500"
                          : "text-white/70 group-hover:text-blue-500"
                          } transition-colors duration-200`}
                      />
                      <span
                        className={`text-xs sm:text-sm ${isBookmarked ? "text-blue-500" : "text-white/70"
                          }`}
                      >
                        Save
                      </span>
                    </button>
                  </fetcher.Form>

                  <button
                    onClick={shareBlog}
                    className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors group text-xs sm:text-sm"
                  >
                    <Share2 className=" h-4 sm:h-5 sm:w-5 group-hover:text-blue-400" />
                    <span>Share</span>
                  </button>
                  {blog.authorId === user?.id ? (
                    <button
                      className="p-2 rounded-lg hover:bg-red-200/30"
                      onClick={() => {
                        deleteFetcher.submit(
                          {
                            id: blog.id,
                          },
                          {
                            action: "/deleteBlog",
                            method: "DELETE",
                          }
                        );
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  ) : null}
                  <div className="flex items-center justify-between gap-1 text-white/70">
                    <EyeIcon className="h-4 w-4" />
                    {blog.views.length}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <img
                    src={blog.authorImgUrl}
                    alt={blog.author.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/40";
                    }}
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-medium">
                      {blog.author.name}
                    </div>
                    <div className="text-xs text-white/60">Author</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-4 sm:mt-6 lg:mt-8 bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                  Comments ({blog.comments.length})
                </h3>

                {/* Add Comment */}
                <div className="mb-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4">
                    <img
                      src={user?.imageUrl || "https://via.placeholder.com/40"}
                      alt="Your profile"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/40";
                      }}
                    />
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCommentSubmit(e);
                            }
                          }}
                          placeholder="Add a comment..."
                          className="w-full p-2 sm:p-3 pr-10 sm:pr-12 bg-[#0a0a0a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-white/40 text-white text-sm"
                        />
                        <button
                          onClick={handleCommentSubmit}
                          disabled={!comment}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${comment
                            ? "text-blue-500 hover:bg-white/5"
                            : "text-white/30"
                            } transition-colors`}
                        >
                          <SendHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4 sm:space-y-6 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {comments.length === 0 ? (
                    <div className="text-center p-6 sm:p-8 text-white/50">
                      <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                      <p className="text-sm sm:text-base">
                        Be the first to comment on this post!
                      </p>
                    </div>
                  ) : (
                    comments.map((comment: Comment) => (
                      <div
                        key={comment.id}
                        className="border-b border-white/5 pb-4 sm:pb-6"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={
                              comment.user.pfpUrl ||
                              "https://via.placeholder.com/40"
                            }
                            alt={comment.user.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/40";
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-medium text-sm sm:text-base">
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

                              {/* Comment actions */}
                              {user?.id === comment.user.identifier && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleEdit(comment.id, comment.comment)
                                    }
                                    className="text-white/60 hover:text-white transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="text-white/60 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Comment text or edit form */}
                            {editingComment === comment.id ? (
                              <div className="mt-2">
                                <div className="flex items-start gap-2">
                                  <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) =>
                                      setEditText(e.target.value)
                                    }
                                    className="flex-1 p-2 bg-[#0a0a0a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-sm"
                                    placeholder="Edit your comment..."
                                  />
                                  <button
                                    onClick={() => submitEdit(comment.id)}
                                    disabled={!editText.trim()}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingComment(null)}
                                    className="px-2 py-1 bg-[#333] text-white rounded text-xs hover:bg-[#444] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-white/80 text-sm sm:text-base">
                                {comment.comment}
                              </p>
                            )}

                            {/* Reply button */}
                            <div className="mt-2">
                              <button
                                onClick={() => handleReply(comment.id)}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                              >
                                <ReplyIcon className="w-3 h-3" />
                                Reply
                              </button>
                            </div>

                            {/* Reply form */}
                            {replyingTo === comment.id && (
                              <div className="mt-3 pl-3 border-l-2 border-white/10">
                                <div className="flex items-start gap-2">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) =>
                                      setReplyText(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        replyText !== ""
                                      ) {
                                        submitReply(comment.id);
                                      }
                                    }}
                                    className="flex-1 p-2 bg-[#0a0a0a] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-xs"
                                    placeholder="Write a reply..."
                                  />
                                  <button
                                    onClick={() => submitReply(comment.id)}
                                    disabled={!replyText.trim()}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Reply
                                  </button>
                                  <button
                                    onClick={() => setReplyingTo(null)}
                                    className="px-2 py-1 bg-[#333] text-white rounded text-xs hover:bg-[#444] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Comment replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-3">
                                {renderReplies(comment.replies, comment.id)}
                              </div>
                            )}
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
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Author Card */}
            <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold mb-4 border-b border-white/10 pb-2">
                  About the Author
                </h3>
                <div className="flex items-center mb-4">
                  <img
                    src={blog.authorImgUrl}
                    alt={blog.author.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-blue-500 mr-3 sm:mr-4"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/64";
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">
                      {blog.author.name}
                    </h4>
                    <p className="text-white/70 text-xs sm:text-sm">
                      Content Creator
                    </p>
                  </div>
                </div>
                <p className="text-white/80 text-xs sm:text-sm mb-4">
                  Author of insightful articles and thought-provoking content.
                </p>
                <Link
                  to={`/dashboard/profile/${blog.authorId}`}
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
                >
                  <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  View Profile
                </Link>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts && relatedPosts.length > 0 && (
              <div className="bg-[#111111] border border-white/5 rounded-xl shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold mb-4 border-b border-white/10 pb-2">
                    Related Posts
                  </h3>
                  <div className="space-y-4">
                    {relatedPosts.map(
                      (post: {
                        id: number;
                        title: string;
                        imgUrl: string;
                        publishDate: string;
                        author: { name: string };
                        likes: any[];
                        tags: string[];
                      }) => (
                        <Link
                          key={post.id}
                          to={`/dashboard/fullblog/${post.id}`}
                          className="block group"
                        >
                          <div className="flex gap-3 items-start">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                              {post.imgUrl ? (
                                <img
                                  src={post.imgUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.parentElement?.classList.add(
                                      "bg-gradient-to-r",
                                      "from-blue-500/20",
                                      "to-purple-500/20"
                                    );
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                  <TagIcon className="w-6 h-6 text-blue-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm sm:text-base line-clamp-2 group-hover:text-blue-400 transition-colors">
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
                              {post.tags && post.tags.length > 0 && (
                                <span className="inline-block text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded mt-1">
                                  {post.tags[0]}
                                </span>
                              )}
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
