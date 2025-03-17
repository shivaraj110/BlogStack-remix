import { SignOutButton, UserButton, useUser } from "@clerk/remix";
import { Link, Outlet } from "@remix-run/react";
import {
  AlignJustify,
  X,
  BookMarked,
  LayoutDashboard,
  TextQuote,
  NotebookPen,
  MessageSquareText,
  Search,
  Bell,
  Settings,
} from "lucide-react";
import { useState } from "react";

const Home = () => {
  const [isMobile, setIsMObile] = useState(false);
  const { user } = useUser();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pt-5">
        <AlignJustify
          className="md:hidden flex cursor-pointer text-white hover:text-gray-300 transition-colors"
          onClick={() => {
            setIsMObile(!isMobile);
          }}
        />
      </div>
      <div className="fixed w-full max-w-[1400px] mb-10 items-center left-1/2 -translate-x-1/2 z-20 px-4">
        <div className="backdrop-brightness-75 text-white bg-[#0a0a0a]/30 border border-white/10 mx-auto transition-all duration-300 md:flex hidden overflow-hidden p-4 mt-5 rounded-3xl backdrop-blur-md shadow-lg hover:shadow-xl">
          <main className="flex-1">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                <Link
                  to={"/dashboard"}
                  className="flex items-center space-x-2 group"
                >
                  <div className="p-2 rounded-xl bg-blue-400/10 group-hover:bg-blue-400/20 transition-colors">
                    <LayoutDashboard className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-medium text-sm md:text-base text-white group-hover:text-blue-400 transition-colors">
                    Dashboard
                  </span>
                </Link>
                <Link
                  to={"/dashboard/blogs"}
                  className="flex items-center space-x-2 group"
                >
                  <div className="p-2 rounded-xl bg-purple-400/10 group-hover:bg-purple-400/20 transition-colors">
                    <TextQuote className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="font-medium text-sm md:text-base text-white group-hover:text-purple-400 transition-colors">
                    Blogs
                  </span>
                </Link>
                <Link
                  to={"/dashboard/bookmarks"}
                  className="flex items-center space-x-2 group"
                >
                  <div className="p-2 rounded-xl bg-green-400/10 group-hover:bg-green-400/20 transition-colors">
                    <BookMarked className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="font-medium text-sm md:text-base text-white group-hover:text-green-400 transition-colors">
                    Bookmarks
                  </span>
                </Link>
                <Link
                  to={"/dashboard/blog/solo"}
                  className="flex items-center space-x-2 group"
                >
                  <div className="p-2 rounded-xl bg-orange-400/10 group-hover:bg-orange-400/20 transition-colors">
                    <NotebookPen className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="font-medium text-sm md:text-base text-white group-hover:text-orange-400 transition-colors">
                    Write
                  </span>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-40 md:w-48 px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all text-sm md:text-base text-white placeholder-white/40"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                </div>
                <Link
                  to={"/dashboard/chatbox"}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <MessageSquareText className="w-5 h-5 text-white/70 group-hover:text-blue-400 transition-colors" />
                </Link>
                <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <Bell className="w-5 h-5 text-white/70 group-hover:text-blue-400 transition-colors" />
                </button>
                <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <Settings className="w-5 h-5 text-white/70 group-hover:text-blue-400 transition-colors" />
                </button>
                <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
                  <span className="font-medium text-sm md:text-base text-white">
                    {user?.username}
                  </span>
                  <UserButton />
                </div>
              </div>
            </header>
          </main>
        </div>
      </div>
      <div
        className={`bg-gray-900/35 text-white backdrop-brightness-200 backdrop-blur-sm transition-all duration-300 ${
          isMobile ? "h-full w-full" : "h-0 w-0"
        } -translate-y-10 flex-col overflow-hidden rounded-3xl shadow-xl`}
      >
        <div className="pt-5 px-5">
          <X
            className="flex ml-auto cursor-pointer hover:text-gray-300 transition-colors"
            onClick={() => {
              setIsMObile(!isMobile);
            }}
          />
          <ul className="self-center p-12 h-dvh space-y-8">
            <li>
              <Link
                to={"/dashboard"}
                className="text-xl hover:text-blue-400 transition-colors flex items-center space-x-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to={"blogs"}
                className="text-xl hover:text-purple-400 transition-colors flex items-center space-x-2"
              >
                <TextQuote className="w-5 h-5" />
                <span>Blogs</span>
              </Link>
            </li>
            <li>
              <Link
                to={"bookmarks"}
                className="text-xl hover:text-green-400 transition-colors flex items-center space-x-2"
              >
                <BookMarked className="w-5 h-5" />
                <span>Bookmarks</span>
              </Link>
            </li>
            <li>
              <Link
                to={"blog/solo"}
                className="text-xl hover:text-orange-400 transition-colors flex items-center space-x-2"
              >
                <NotebookPen className="w-5 h-5" />
                <span>Write</span>
              </Link>
            </li>
            <li className="text-xl">
              <SignOutButton />
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-20 overflow-y-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default Home;
