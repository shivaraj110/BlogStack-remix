import { useUser } from "@clerk/remix";
import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { Bookmark, Heart, SendHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { getBookmarks } from "~/.server/bookmark";
import { prisma } from "~/.server/db";
import { getLikes } from "~/.server/likes";

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
  const blogFirstPart = blog.content.slice(0, 350);
  const blogSecondPart = blog.content.slice(350, blog.content.length - 1);
  const fetcher = useFetcher();
  const [isBookmarked, setIsBookmarked] = useState(BookMarked);
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = searchParams.get("theme");

  useEffect(() => {
    setIsLiked(Liked());
    setIsBookmarked(BookMarked());
  }, [Liked(), BookMarked()]);

  return (
    <div className="p-8 mx-auto mt-6 flex">
      <div
        className={`  ${
          theme !== "dark" ? "text-slate-900" : " text-slate-900"
        } p-10  border  w-[80%] bg-white/20 h-fit backdrop-brightness-95 rounded-lg backdrop-blur-sm shadow-2xl`}
      >
        <div className="flex gap-5">
          <div className="flex flex-col gap-4">
            <div className="font-semibold flex justify-between gap-2 text-xl">
              {blog.title}
              <div className="flex gap-2 justify-center items-center">
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
                      }, 1000);
                    }}
                    type="submit"
                    name="postId"
                    value={blog.id}
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
                <fetcher.Form
                  method={Liked() ? "DELETE" : "POST"}
                  action={Liked() ? "/api/removelike" : "/api/addlike"}
                >
                  <div
                    className={`flex items-center space-x-2 transition-colors duration-200`}
                  >
                    <input type="hidden" name="postId" value={blog.id} />
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
                      <span className="text-xs">{blog.likes.length}</span>
                    </div>
                    <span className="text-xs space-x-1 flex"></span>
                  </div>
                </fetcher.Form>
              </div>
            </div>

            <div className="py-5">{blogFirstPart}</div>
            <img
              src={blog.imgUrl}
              alt="blog image "
              className="rounded-lg object-scale-down size-full "
            />
            <div className="py-5">{blogSecondPart}</div>

            <div className="flex justify-between">
              <div className="flex space-x-4 size-fit">
                {blog.tags.map((tag) => (
                  <Link
                    to={`/dashboard/blog/${tag}`}
                    className="p-[5px] text-blue-700 hover:bg-blue-300/60 rounded-sm"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
              <div className="flex border justify-between backdrop-brightness-95 rounded-lg cursor-pointer bg-white/20 backdrop-blur-sm p-5 space-y-2 text-black items-center">
                <div className="mx-2">
                  <div className="">
                    {" - "}
                    {blog.author.name ?? "Anonymous"}
                  </div>

                  <div className="text-gray-800 mx-2 ">
                    {"Published on " + blog.publishDate}
                  </div>
                </div>
                <div className="">
                  <img
                    src={blog.authorImgUrl}
                    alt="authorImage"
                    className="rounded-md size-16 border"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className=" flex flex-col mx-auto justify-between"></div>
        </div>
      </div>
      <div
        className={` ${
          theme == "dark" ? "text-gray-800" : "text-gray-800"
        } flex w-[500px] backdrop-blur-sm bg-white/20  rounded-lg backdrop-brightness-95 shadow-lg h-fit p-5 mx-5 flex-col`}
      >
        <div className="flex border border-gray-300 p-2 rounded-lg">
          <input
            type="text"
            onChange={(e) => {
              setComment(e.target.value);
            }}
            className={`outline-none mt-2 bg-transparent border-black p-1 w-[400px] 
              theme == "dark"
                  placeholder:text-gray-800
            `}
            placeholder="Add a comment"
          />
          <fetcher.Form
            method="POST"
            action={comment !== "" ? "/api/pushcomment" : ""}
          >
            <input type="hidden" name="postId" value={blog.id} />
            <input type="hidden" name="comment" value={comment} />
            <button
              type="submit"
              className="   -translate-x-6 translate-y-2 pt-1 cursor-pointer"
            >
              <SendHorizontal />
            </button>
          </fetcher.Form>
        </div>
        <div className="p-4 border bg-white/25 h-[620px] overflow-y-auto rounded-lg mt-2 space-y-4">
          {blog.comments.map((c) => (
            <div
              className={` ${
                c ? "flex" : "hidden"
              } border-gray-300 w-full border-b p-2 `}
            >
              <div className="flex flex-col space-y-3 p-5 ">
                <div className={`flex items-center gap-3 `}>
                  <img
                    src={c.user.pfpUrl}
                    className="rounded-full size-10 border"
                  />
                  <div> {c.user.name} </div>
                  <div className="space-x-1">
                    {" "}
                    {c.commentedAt.toString().split(" ")[0] +
                      " " +
                      c.commentedAt.toString().split(" ")[1] +
                      " " +
                      c.commentedAt.toString().split(" ")[2]}
                  </div>
                </div>
                <div className="items-center flex pl-[50px]">
                  <div className="">{c.comment}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default FullBlog;
