import { useEffect, useState } from "react";
import { Bookmark, Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { Fetcher, Link } from "react-router-dom";
import { useFetcher } from "@remix-run/react";
import { useUser } from "@clerk/remix";
import { BlogData } from "~/types/BlogData";

function stripHtml(html: string): string {
  // Check if we're in the browser environment
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  // Server-side fallback - simple regex to strip HTML tags
  return html.replace(/<[^>]*>?/gm, "");
}

function MyBlogPost({
  authorName,
  title,
  content,
  publishDate,
  tags,
  likes,
  likeCount,
  comments,
  id,
  authorImgUrl,
  imgUrl,
  bookmarks,
}: BlogData) {
  const BookMarked = () => {
    let val = false;
    bookmarks.map((b) => {
      if (b === id) {
        val = true;
      }
    });
    return val;
  };

  const Liked = () => {
    let val = false;
    likes.map((l) => {
      if (l === id) {
        val = true;
      }
    });
    return val;
  };
  const fetcher = useFetcher<Fetcher>();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState<boolean>(Liked);
  const [isBookmarked, setIsBookmarked] = useState(BookMarked);

  useEffect(() => {
    setIsLiked(Liked);
    setIsBookmarked(BookMarked);
  }, [Liked, BookMarked]);

  return (
    <div className=" bg-white/25  backdrop-brightness-95 text-slate-900 backdrop-blur-sm rounded-md border border-gray-200 overflow-hidden my-4">
      <div className="p-5">
        <div className="flex items-center mb-4">
          <img
            className="h-9 w-9 rounded-full border-2 border-blue-500 mr-2"
            src={authorImgUrl}
            alt={authorName}
          />
          <div>
            <h2 className="text-base font-medium ">{authorName}</h2>
            <p className="text-xs">{publishDate}</p>
          </div>
        </div>
        <div className="md:pl-10">
          <Link to={`/dashboard/fullblog/${id}`}>
            <h1 className="text-2xl font-bold  mb-2 hover:text-blue-600  cursor-pointer transition-colors duration-200">
              {title}
            </h1>
          </Link>
          <div className="text-sm grid grid-cols-3 mb-4">
            <div className="col-span-2">
              {stripHtml(content).slice(0, 400) +
                (content.length < 400 ? "" : "...")}
            </div>
            <div className="mx-auto">
              <img
                src={imgUrl}
                alt="BlogImage"
                className="cursor-pointer object-scale-down size-full border rounded-lg col-span-1"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs text-blue-600 rounded px-2 py-1 mb-2 hover:bg-blue-200  transition-colors duration-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex sm:flex-row flex-col items-center justify-between text-sm  ">
            <div className="flex items-center space-x-4">
              <fetcher.Form
                method={Liked() ? "DELETE" : "POST"}
                action={Liked() ? "/api/removelike" : "/api/addlike"}
              >
                <div
                  className={`flex items-center space-x-2 transition-colors duration-200`}
                >
                  <input type="hidden" name="postId" value={id} />
                  <input type="hidden" name="userId" value={user?.id ?? ""} />
                  <div className="flex items-center space-x-1">
                    <button
                      type="submit"
                      onClick={() => {
                        setIsLiked(!isLiked);
                      }}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isLiked
                            ? "fill-current text-red-500"
                            : "hover:text-red-500"
                        }`}
                      />
                    </button>
                    <span className="text-xs">{likeCount}</span>
                  </div>
                  <span className="text-xs space-x-1 flex"></span>
                </div>
              </fetcher.Form>
              <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200">
                <MessageCircle className="h-5 w-5" />
                <span>{comments} Comments</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-blue-600  rounded-full px-2 py-1">
                {Math.floor(content.split(" ").length / 60) + " mins read"}
              </span>
              <fetcher.Form method="delete" action={"/deleteBlog"}>
                <button
                  className="text-gray-900"
                  type="submit"
                  name="id"
                  value={id}
                >
                  <Trash2 className="hover:fill-red-300 hover:text-red-700 transi delay-75" />
                </button>
              </fetcher.Form>
              <fetcher.Form
                method={isBookmarked ? "DELETE" : "POST"}
                action={isBookmarked ? "/removebookmarks" : "/addbookmark"}
              >
                <input type="hidden" name="userId" value={user?.id ?? ""} />
                <button
                  onClick={() => {
                    setTimeout(() => {
                      setIsBookmarked(!isBookmarked);
                    }, 1000);
                  }}
                  type="submit"
                  name="postId"
                  value={id}
                  className={`${
                    isBookmarked ? "text-blue-500" : "hover:text-blue-500"
                  } transition-colors duration-200`}
                >
                  <Bookmark
                    className={`h-5 w-5 ${
                      isBookmarked ? "fill-current" : "fill-none"
                    }`}
                  />
                </button>
              </fetcher.Form>
              <button className="hover:text-green-500 transition-colors duration-200">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyBlogPost;
