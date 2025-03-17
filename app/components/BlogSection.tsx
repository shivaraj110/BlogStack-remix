import { Link } from "@remix-run/react";
interface BlogCard {
  blogs: number;
  bookmarks: number;
}
export function BlogSection(data: BlogCard) {
  return (
    <div className="bg-white/25 dark:bg-[#0a0a0a]/25 backdrop-brightness-95 backdrop-blur-md border dark:border-white/10 rounded-xl shadow-2xl">
      <div className="flex items-center justify-between p-6 border-b dark:border-white/10">
        <h2 className="text-xl font-semibold pr-3 dark:text-white">Blogs</h2>
        <div className="flex gap-2">
          <Link
            to={"blogs"}
            className="relative underline cursor-pointer dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            View all Blogs
          </Link>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <BlogItem
          title="My Blogs"
          number={data.blogs.toString() ?? "0"}
          status="Published"
        />
        <BlogItem
          title="Bookmarks"
          number={data.bookmarks.toString() ?? "0"}
          status="Bookmarked"
        />
      </div>
    </div>
  );
}

function BlogItem({
  title,
  number,
  status,
}: {
  title: string;
  number: string;
  status: "Published" | "Bookmarked";
}) {
  return (
    <div className="flex items-center text-slate-900 dark:text-white justify-between p-4 rounded-lg border-b-[1px] dark:border-white/10">
      <div>
        <h3 className="font-medium dark:text-white">{title}</h3>
        <p className="text-sm text-slate-900 dark:text-gray-400">{number}</p>
      </div>
      <Link to={status === "Published" ? "myblogs" : "bookmarks"}>
        <button
          className={`px-3 py-1 text-sm rounded-md text-green-700 dark:text-green-400 underline transition-colors`}
        >
          {status === "Published" ? "View My Blogs" : "View Bookmarks"}
        </button>
      </Link>
    </div>
  );
}
