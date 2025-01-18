import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getBookmarks } from "~/.server/bookmark";
import { prisma } from "~/.server/db";
import MyBlogPost from "~/components/MyBlog";

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const blogs = await prisma.post.findMany({
    where: {
      authorId: userId?.toString() ?? "",
    },
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
      author: {
        select: {
          name: true,
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
};

const MyBlogs = () => {
  interface BlogType {
    id: number;
    title: string;
    content: string;
    published: boolean;
    authorId: string;
    authorImgUrl: string;
    publishDate: string;
    tags: string[];
    likes: number;
    imgUrl: string;
    author: {
      name: string;
    };
  }
  const { body } = useLoaderData<typeof loader>();
  const blogs: BlogType[] = body.blogs;
  const bookmarks: number[] = body.bookMarkPostIds;

  if (!blogs[0]) {
    return (
      <div className="p-5 flex">
        you have no blogs published,
        <Link to={"/dashboard/blogs"} className="underline px-1 cursor-pointer">
          Write blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="p-1 max-w-7xl mx-auto">
      <div className="flex flex-col">
        <div className="mt-6">
          {blogs.map((b: BlogType) => (
            <MyBlogPost
              key={b.id}
              imgUrl={b.imgUrl}
              authorImgUrl={b.authorImgUrl}
              authorName={b.author.name || "Anonymous"}
              title={b.title}
              content={b.content}
              tags={!b.tags ? ["notags"] : b.tags}
              publishDate={b.publishDate ? b.publishDate : "no trace"}
              likes={b.likes}
              id={Number(b.id)}
              bookmarks={bookmarks}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
export default MyBlogs;
