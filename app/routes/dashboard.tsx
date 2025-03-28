import { SignOutButton, UserButton, useUser } from "@clerk/remix";
import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, useLocation, useNavigate } from "@remix-run/react";
import {
  AlignJustify,
  X,
  BookMarked,
  LayoutDashboard,
  NotebookPen,
  MessageSquareText,
  Search,
  Bell,
  Settings,
  Home,
  LogOut,
  BarChart2,
  Users,
  Star,
  Sparkles,
  Compass,
} from "lucide-react";
import { useState, useEffect } from "react";
import SocketInitializer from "~/components/SocketInitializer";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  if (!userId) return redirect("/blog");
  return null;
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const hamburger = document.getElementById("hamburger-button");

      if (
        sidebarOpen &&
        sidebar &&
        hamburger &&
        !sidebar.contains(event.target as Node) &&
        !hamburger.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Check if current route matches link
  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path !== "/dashboard" && location.pathname.startsWith(path))
    );
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `/dashboard/blogs?search=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  // Navigation items with their respective icons and paths
  const navItems = [
    {
      section: "Main",
      items: [
        {
          name: "Home",
          icon: <Home className="h-5 w-5" />,
          path: "/dashboard",
        },
        {
          name: "Explore",
          icon: <Compass className="h-5 w-5" />,
          path: "/dashboard/blogs",
        },
        {
          name: "My Blogs",
          icon: <BarChart2 className="h-5 w-5" />,
          path: "/dashboard/myblogs",
        },
        {
          name: "Bookmarks",
          icon: <BookMarked className="h-5 w-5" />,
          path: "/dashboard/bookmarks",
        },
      ],
    },
    {
      section: "Create",
      items: [
        {
          name: "Write Blog",
          icon: <NotebookPen className="h-5 w-5" />,
          path: "/dashboard/blog/solo",
        },
        {
          name: "New Story",
          icon: <Sparkles className="h-5 w-5" />,
          path: "/dashboard/blog/new",
        },
      ],
    },
    {
      section: "Social",
      items: [
        {
          name: "Messages",
          icon: <MessageSquareText className="h-5 w-5" />,
          path: "/dashboard/messages",
        },
        {
          name: "Friends",
          icon: <Users className="h-5 w-5" />,
          path: "/dashboard/friends",
        },
        {
          name: "Community",
          icon: <Users className="h-5 w-5" />,
          path: "/dashboard/community",
        },
        {
          name: "Featured",
          icon: <Star className="h-5 w-5" />,
          path: "/dashboard/featured",
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0a] to-[#111827] text-white overflow-hidden">
      {/* Socket initializer */}
      <SocketInitializer />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 z-30 h-full w-72 bg-gradient-to-b from-[#111111] to-[#0d0d0d] border-r border-white/10 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 text-white group"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg transition-all duration-300 group-hover:shadow-blue-500/20">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                BlogStack
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            {/* User Info */}
            <div className="flex items-center space-x-4 mb-8 px-2 py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
              <UserButton />
              <div>
                <p className="text-sm font-semibold">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-white/60">@{user?.username}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-6">
              {navItems.map((section) => (
                <div key={section.section}>
                  <p className="px-2 text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    {section.section}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group ${
                            active
                              ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-400 font-medium"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {active && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
                          )}
                          <span
                            className={`${
                              active
                                ? "text-blue-400"
                                : "text-white/60 group-hover:text-white group-hover:scale-110"
                            } transition-all duration-200`}
                          >
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                          {active && (
                            <span className="absolute right-4 h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10">
            <SignOutButton>
              <button className="flex items-center justify-center w-full space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 text-white/80 hover:text-white transition-all duration-200 group">
                <LogOut className="h-5 w-5 text-red-400 group-hover:scale-110 transition-transform" />
                <span>Sign Out</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-[#111111]/90 backdrop-blur-md border-b border-white/10 py-4 px-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                id="hamburger-button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 mr-2 rounded-md text-white/70 hover:text-white focus:outline-none hover:bg-white/5 transition-colors"
              >
                <AlignJustify className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold lg:hidden bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                BlogStack
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search blogs, tags, people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-72 px-4 py-2 pl-10 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 hover:bg-white/10 transition-all text-white placeholder-white/40"
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Action Icons */}
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors relative group">
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                <Bell className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              </button>

              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                <Settings className="h-5 w-5 text-white/70 group-hover:text-white group-hover:rotate-45 transition-all duration-300" />
              </button>

              {/* Mobile User Button - Only shown on smaller screens */}
              <div className="lg:hidden">
                <UserButton />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={`flex-1 overflow-y-auto bg-[#0a0a0a] ${
            !useLocation().pathname.startsWith("/dashboard/messages")
              ? "p-6"
              : ""
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
