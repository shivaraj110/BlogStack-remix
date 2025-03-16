import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getBookmarks } from "~/.server/bookmark";
import { prisma } from "~/.server/db";
import BlogPost from "~/components/Blog";

export const loader: LoaderFunction = async (args) => {
  const { userId } = await getAuth(args);
  try {
    const blogs = await prisma.post.findMany({
      select: {
        id: true,
        tags: true,
        title: true,
        content: true,
        likes: true,
        authorId: true,
        imgUrl: true,
        publishDate: true,
        authorImgUrl: true,
        comments: true,
        author: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
    const bookmarks = await getBookmarks(userId ?? "");
    let bookMarkPostIds: number[] = [];
    bookmarks?.map((b) => [bookMarkPostIds.push(b.postId)]);
    return {
      status: "success",
      body: {
        blogs,
        bookMarkPostIds,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      status: "fail",
    };
  }
};

export default function () {
  interface BlogData {
    title: string;
    content: string;
    authorId: number;
    publishDate: string;
    likes: number;
    comments: [];
    likedBy: {
      identifier: string;
      fname: string;
      lname: string;
      pfpUrl: string;
    }[];
    imgUrl: string;
    authorImgUrl: string;
    tags: string[];
    author: {
      name: string;
      id: number;
    };
    id: number;
  }

  const { body } = useLoaderData<typeof loader>();
  const blogs: BlogData[] = body.blogs;
  const bookmarkIds: number[] = body.bookMarkPostIds;
  if (!blogs[0]) {
    return (
      <div className="p-5 flex">
        No blogs added yet. Be the first one to{" "}
        <Link to={"/blog/write"} className="underline px-1 cursor-pointer">
          add blogs
        </Link>
        !
      </div>
    );
  }

  return (
    <div className="p-1 max-w-7xl mt-6 mx-auto">
      <div className="flex flex-col">
        <div className="mt-6">
          {blogs.map((b, key: number = 0) => (
            <div key={key++}>
              <BlogPost
                comments={b.comments.length}
                authorId={b.author.id}
                key={b.id}
                imgUrl={b.imgUrl ?? ""}
                authorImgUrl={b.authorImgUrl}
                authorName={b.author.name || "Anonymous"}
                title={b.title}
                content={b.content}
                tags={!b.tags ? ["notags"] : b.tags}
                publishDate={b.publishDate ? b.publishDate : "no trace"}
                likes={b.likes}
                id={b.id}
                bookmarks={bookmarkIds}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
