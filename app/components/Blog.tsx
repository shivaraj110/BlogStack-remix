import { useCallback, useEffect, useState } from "react";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";
import { Fetcher, Link, useFetcher, useSearchParams } from "@remix-run/react";
import { useUser } from "@clerk/remix";
import { BlogData } from "~/types/BlogData";

function BlogPost({
  authorName,
  authorId,
  title,
  content,
  publishDate,
  comments,
  tags,
  likes,
  likeCount,
  id,
  authorImgUrl,
  imgUrl,
  bookmarks,
}: BlogData) {
  const { user } = useUser();

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

  const [isLiked, setIsLiked] = useState<boolean>(Liked);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(BookMarked);
  const [searchParams, setSearchParams] = useSearchParams();

  const theme = searchParams.get("theme");
  const fetcher = useFetcher<Fetcher>();

  useEffect(() => {
    setIsLiked(Liked());
    setIsBookmarked(BookMarked());
  }, [Liked(), BookMarked()]);

  return (
    <div
      className={`bg-white/25 dark:bg-[#0a0a0a]/25 backdrop-brightness-95 backdrop-blur-sm rounded-lg border dark:border-white/10 transi border-gray-200 overflow-hidden my-4`}
    >
      <div className="p-5">
        <div className="flex items-center mb-4">
          <Link to={`/dashboard/profile/${authorId}`}>
            <img
              className="h-9 w-9 object-scale-down rounded-full border-2 border-blue-500 mr-2"
              src={authorImgUrl}
              alt={authorName}
            />
          </Link>
          <div>
            <h2 className="text-base font-medium dark:text-white">
              {authorName}
            </h2>
            <p className="text-xs dark:text-gray-400">{publishDate}</p>
          </div>
        </div>
        <div className="md:pl-10">
          <Link to={`/dashboard/fullblog/${id}`}>
            <h1 className="text-2xl font-bold mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors duration-200 dark:text-white">
              {title}
            </h1>
          </Link>
          <div className="text-sm grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2 dark:text-gray-300">
              {content.slice(0, 600) + (content.length < 600 ? "" : "...")}
            </div>
            <div className="mx-auto col-span-1 pl-5">
              <img
                src={imgUrl}
                alt="BlogImage"
                className="cursor-pointer object-scale-down size-full border dark:border-white/10 rounded-lg col-span-1"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Link
                  to={`/dashboard/blog/${tag}`}
                  key={index}
                  className="text-xs text-blue-600 rounded px-2 py-1 mb-2 hover:bg-blue-200  transition-colors duration-200"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm  ">
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
              <Link to={`/dashboard/fullblog/${id}`}>
                <span className="text-xs text-blue-600  rounded-full px-2 py-1 cursor-pointer">
                  Read more..
                </span>
              </Link>
              <span className="text-xs text-blue-600  rounded-full px-2 py-1">
                {Math.floor(content.split(" ").length / 60) + " mins read"}
              </span>
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

export default BlogPost;
//370*245
