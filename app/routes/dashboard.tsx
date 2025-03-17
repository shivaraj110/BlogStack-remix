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
} from "lucide-react";
import { useState, useEffect } from "react";

const Home = () => {
  const [isMobile, setIsMObile] = useState(false);
  const { user } = useUser();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.toggle("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.toggle("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };
  return (
    <div className="max-w-7xl mx-auto ">
      <div className="pt-5 px-5">
        <AlignJustify
          className={`md:hidden flex cursor-pointer text-slate-900`}
          onClick={() => {
            setIsMObile(!isMobile);
          }}
        />
      </div>
      <div className="fixed w-[1080px] mb-10 items-center left-1/2 -translate-x-1/2 z-20">
        {" "}
        <div
          className={`backdrop-brightness-75 text-slate-900
          bg-white/25 border mx-auto transi md:flex hidden overflow-hidden sm:mx-10 p-5 mt-5 rounded-3xl backdrop-blur-sm shadow-2xl`}
        >
          <main className="flex-1 ">
            <header className="flex justify-between items-center">
              <div className="flex sm:flex-row flex-col items-center space-x-20">
                <Link
                  to={"/dashboard"}
                  className={`text-2xl overflow-x-auto  flex items-center overflow-hidden   font-light`}
                >
                  <div>
                    <LayoutDashboard className="" />
                  </div>
                </Link>
                <Link
                  to={"/dashboard/blogs"}
                  className={`text-2xl overflow-x-auto flex items-center overflow-hidden   font-light`}
                >
                  <div>
                    <TextQuote className="" />
                  </div>
                </Link>
                <Link
                  to={"/dashboard/bookmarks"}
                  className={`text-2xl overflow-x-auto flex items-center overflow-hidden   font-light`}
                >
                  <div>
                    <BookMarked className="" />
                  </div>
                </Link>
                <Link
                  to={"/dashboard/blog/solo"}
                  className={`text-2xl overflow-x-auto flex items-center overflow-hidden   font-light`}
                >
                  <div>
                    <NotebookPen className="" />
                  </div>
                </Link>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="size-fit flex">
                  <label htmlFor="theme" className="theme">
                    <span className="theme__toggle-wrap">
                      <input
                        id="theme"
                        className="theme__toggle cursor-pointer"
                        type="checkbox"
                        role="switch"
                        name="theme"
                        checked={isDark}
                        onChange={toggleDarkMode}
                      />
                      <span className="theme__fill" />
                      <span className="theme__icon">
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                        <span className="theme__icon-part" />
                      </span>
                    </span>
                  </label>
                </div>
                <Link
                  to={"/dashboard/chatbox"}
                  className={`text-2xl  font-thin overflow-x-auto flex items-center overflow-hidden `}
                >
                  <MessageSquareText className="" />
                </Link>
                <span className=" items-center">{user?.username}</span>
                <div className="flex">
                  <UserButton />
                </div>
              </div>
            </header>
          </main>
        </div>
      </div>
      <div
        className={`bg-gray-900/35 text-slate-900 backdrop-brightness-200 backdrop-blur-sm transi ${
          isMobile ? "h-full w-full " : "h-0 w-0"
        } -translate-y-10 flex-col  overflow-hidden rounded-3xl shadow-xl`}
      >
        <div className="pt-5 px-5">
          <X
            className="flex ml-auto cursor-pointer"
            onClick={() => {
              setIsMObile(!isMobile);
            }}
          />
          <ul className=" self-center p-12 h-dvh space-y-6">
            <li>
              <Link to={"/dashboard"} className="text-xl ">
                Dashboard
              </Link>
            </li>
            <li>
              {" "}
              <Link to={"blogs"} className="text-xl ">
                Blogs
              </Link>
            </li>
            <li>
              <Link to={"bookmarks"} className="text-xl ">
                Bookmarks
              </Link>
            </li>
            <li>
              {" "}
              <Link to={"blog/solo"} className="text-xl">
                write
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
