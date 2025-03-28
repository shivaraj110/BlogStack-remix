import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getBookmarks } from "~/.server/bookmark";
import { prisma } from "~/.server/db";
import { getLikes } from "~/.server/likes";
import BlogPost from "~/components/Blog";
import { Tag } from "lucide-react";
export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const tag = args.params["tag"];
  try {
    const blogs = await prisma.post.findMany({
      where: {
        tags: {
          has: tag,
        },
      },
      select: {
        id: true,
        tags: true,
        title: true,
        content: true,
        comments: true,
        views: true,
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
        tag,
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

function stripHtml(html: string): string {
  // Check if we're in the browser environment
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  // Server-side fallback - simple regex to strip HTML tags
  return html.replace(/<[^>]*>?/gm, "");
}

export default function () {
  interface BlogData {
    title: string;
    content: string;
    authorId: number;
    publishDate: string;
    likes: [];
    views: [];
    comments: [];
    imgUrl: string;
    authorImgUrl: string;
    tags: string[];
    author: {
      name: string;
    };
    id: string;
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
    <div className="flex flex-col">
      <div className="mt- flex gap-2 text-2xl font-bold">
        {"Showing results for"}{" "}
        <div className="flex gap-1 items-center">
          <Tag className="size-4 text-blue-300" />
          <p className="text-blue-600"> {body.tag} </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 mt-4 lg:grid-cols-3 gap-6">
        {blogs.map((b) => (
          <BlogPost
            views={b.views.length}
            authorId={b.authorId}
            key={b.id}
            imgUrl={
              b.imgUrl ??
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxrqLPeOlGY5Ezx_xkUTLkTmPSsEVSShRMJg&s"
            }
            authorImgUrl={b.authorImgUrl}
            authorName={b.author.name || "Anonymous"}
            title={b.title}
            content={stripHtml(b.content).substring(0, 120)}
            tags={!b.tags ? ["notags"] : b.tags}
            publishDate={b.publishDate ? b.publishDate : "no trace"}
            likes={b.likes.length}
            comments={b.comments.length}
            likeCount={b.likes.length}
            id={Number(b.id)}
            bookmarked={bookmarkIds.includes(Number(b.id))}
          />
        ))}
      </div>
    </div>
  );
}
