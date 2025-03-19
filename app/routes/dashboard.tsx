import { SignOutButton, UserButton, useUser } from "@clerk/remix";
import { Link, Outlet, useLocation } from "@remix-run/react";
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
  Home,
  LogOut,
  BarChart2,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  const location = useLocation();

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

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-[#111111] border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-6 border-b border-white/10">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-white"
            >
              <LayoutDashboard className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">BlogStack</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-white/70 hover:text-white lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-8 px-2">
              <UserButton />
              <div>
                <p className="text-sm font-medium">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-white/60">@{user?.username}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              <p className="px-2 text-xs font-semibold text-white/40 uppercase tracking-wider mt-6 mb-2">
                Main
              </p>
              <Link
                to="/dashboard"
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive("/dashboard") &&
                  !location.pathname.includes("/dashboard/")
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link
                to="/dashboard/blogs"
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive("/dashboard/blogs")
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <TextQuote className="h-5 w-5" />
                <span>All Blogs</span>
              </Link>
              <Link
                to="/dashboard/myblogs"
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive("/dashboard/myblogs")
                    ? "bg-green-500/20 text-green-400"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <BarChart2 className="h-5 w-5" />
                <span>My Blogs</span>
              </Link>
              <Link
                to="/dashboard/bookmarks"
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive("/dashboard/bookmarks")
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <BookMarked className="h-5 w-5" />
                <span>Bookmarks</span>
              </Link>

              <p className="px-2 text-xs font-semibold text-white/40 uppercase tracking-wider mt-6 mb-2">
                Create
              </p>
              <Link
                to="/dashboard/blog/solo"
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive("/dashboard/blog/solo")
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <NotebookPen className="h-5 w-5" />
                <span>Write Blog</span>
              </Link>

              <p className="px-2 text-xs font-semibold text-white/40 uppercase tracking-wider mt-6 mb-2">
                Social
              </p>
              <Link
                to="/dashboard/chatbox"
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive("/dashboard/chatbox")
                    ? "bg-pink-500/20 text-pink-400"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <MessageSquareText className="h-5 w-5" />
                <span>Messages</span>
              </Link>
              <Link
                to="/dashboard/community"
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive("/dashboard/community")
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Community</span>
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10">
            <SignOutButton>
              <button className="flex items-center space-x-3 px-3 py-3 w-full rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-[#111111] border-b border-white/10 py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                id="hamburger-button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 mr-2 rounded-md text-white/70 hover:text-white focus:outline-none"
              >
                <AlignJustify className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold lg:hidden">BlogStack</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 px-4 py-2 pl-10 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-white placeholder-white/40"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              </div>

              {/* Action Icons */}
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Bell className="h-5 w-5 text-white/70" />
              </button>

              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Settings className="h-5 w-5 text-white/70" />
              </button>

              {/* Mobile User Button - Only shown on smaller screens */}
              <div className="lg:hidden">
                <UserButton />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
