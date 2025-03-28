import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useUser } from "@clerk/remix";
import { prisma } from "~/.server/db";
import {
  UserPlus,
  UserCheck,
  Users,
  MessageSquareText,
  Search,
  UserX,
  Clock,
  Check,
  X,
  MailPlus,
  User,
  UserCog,
  UserMinus,
} from "lucide-react";
import { useState } from "react";
import FriendRequestButton from "~/components/FriendRequestButton";
import { format } from "date-fns";

type Friend = {
  id: string;
  name: string | null;
  pfpUrl: string | null;
  email: string;
  createdAt: string;
};

type FriendRequest = {
  id: number;
  senderId: string;
  senderName: string | null;
  senderPfp: string | null;
  senderEmail: string;
  createdAt: string;
};

type LoaderData = {
  friends: Friend[];
  requests: FriendRequest[];
  error?: string;
};

type TabType = "friends" | "received" | "sent";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  if (!userId) {
    console.log("No userId found in auth");
    return redirect("/login");
  }

  console.log("Loading friends for user:", userId);

  try {
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { identifier: userId },
      select: { id: true },
    });

    if (!user) {
      console.log("User not found in database");
      return json({ friends: [], requests: [], error: "User not found" });
    }

    // Get pending friend requests
    const pendingRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            identifier: true,
            name: true,
            pfpUrl: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${pendingRequests.length} pending requests`);

    // Get all friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: userId, status: "ACCEPTED" },
          { friendId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        user2: {
          select: {
            identifier: true,
            name: true,
            pfpUrl: true,
            email: true,
          },
        },
        user1: {
          select: {
            identifier: true,
            name: true,
            pfpUrl: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${friendships.length} friendships`);

    if (friendships.length === 0) {
      return json({
        friends: [],
        requests: pendingRequests.map((request) => ({
          id: request.id,
          senderId: request.senderId,
          senderName: request.sender.name,
          senderPfp: request.sender.pfpUrl,
          senderEmail: request.sender.email,
          createdAt: request.createdAt.toISOString(),
        })),
      });
    }

    // Transform the results to get the friend's data
    const friends = friendships
      .map((friendship) => {
        const friendData =
          friendship.userId === userId ? friendship.user2 : friendship.user1;
        if (!friendData) {
          console.log("Missing friend data for friendship:", friendship);
          return null;
        }
        return {
          id: friendData.identifier,
          name: friendData.name,
          pfpUrl: friendData.pfpUrl,
          email: friendData.email,
          createdAt: friendship.createdAt.toISOString(),
        };
      })
      .filter(Boolean);

    console.log(`Transformed ${friends.length} friends`);

    // Transform pending requests
    const requests = pendingRequests.map((request) => ({
      id: request.id,
      senderId: request.senderId,
      senderName: request.sender.name,
      senderPfp: request.sender.pfpUrl,
      senderEmail: request.sender.email,
      createdAt: request.createdAt.toISOString(),
    }));

    return json({ friends, requests });
  } catch (error) {
    console.error("Error loading friends:", error);
    return json({
      friends: [],
      requests: [],
      error: error instanceof Error ? error.message : "Failed to load friends",
    });
  }
};

export default function FriendsPage() {
  const data = useLoaderData<typeof loader>();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("friends");

  console.log("Friends page data:", data);
  console.log("Current user:", user);

  if (!user) {
    console.log("No user found");
    return null;
  }

  // Filter friends based on search term
  const filteredFriends =
    data.friends
      ?.filter((friend: Friend | null) => {
        if (!friend) return false;
        const friendName = friend.name?.toLowerCase() || "";
        const friendEmail = friend.email.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return (
          friendName.includes(searchLower) || friendEmail.includes(searchLower)
        );
      })
      .filter((friend): friend is Friend => friend !== null) || [];

  console.log("Filtered friends:", filteredFriends);

  // Add handler functions
  const handleAcceptRequest = async (requestId: number) => {
    try {
      const response = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (response.ok) window.location.reload();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const response = await fetch("/api/friends/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (response.ok) window.location.reload();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fadeIn">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Friends</h1>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/40"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg mb-8">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "friends"
              ? "bg-blue-500 text-white"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>All Friends</span>
          {filteredFriends.length > 0 && (
            <span className="ml-2 bg-white/10 px-2 py-0.5 rounded-full text-sm">
              {filteredFriends.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("received")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "received"
              ? "bg-blue-500 text-white"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Received</span>
          {data.requests.length > 0 && (
            <span className="ml-2 bg-white/10 px-2 py-0.5 rounded-full text-sm">
              {data.requests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "sent"
              ? "bg-blue-500 text-white"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <MailPlus className="h-4 w-4" />
          <span>Sent</span>
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === "friends" &&
          (filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="group bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={friend.pfpUrl || "https://via.placeholder.com/60"}
                    alt={friend.name || "User"}
                    className="h-16 w-16 rounded-full border-2 border-white/10 group-hover:border-blue-500/50 transition-colors"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-lg group-hover:text-blue-400 transition-colors">
                      {friend.name || "Anonymous User"}
                    </h3>
                    <p className="text-sm text-white/60">{friend.email}</p>
                    <p className="text-xs text-white/40 mt-1">
                      Friends since{" "}
                      {format(new Date(friend.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <Link
                    to={`/dashboard/messages/new/${friend.id}`}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    <span>Message</span>
                  </Link>
                  <button
                    onClick={() => handleRejectRequest(Number(friend.id))}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Remove Friend"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-white/40">
              <Users className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No friends found</p>
              <p className="text-sm">Start connecting with other users!</p>
            </div>
          ))}

        {activeTab === "received" &&
          (data.requests.length > 0 ? (
            data.requests.map((request) => (
              <div
                key={request.id}
                className="group bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={request.senderPfp || "https://via.placeholder.com/60"}
                    alt={request.senderName || "User"}
                    className="h-16 w-16 rounded-full border-2 border-white/10 group-hover:border-blue-500/50 transition-colors"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-lg group-hover:text-blue-400 transition-colors">
                      {request.senderName || "Anonymous User"}
                    </h3>
                    <p className="text-sm text-white/60">
                      {request.senderEmail}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      Requested{" "}
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-white/40">
              <UserPlus className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No pending requests</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ))}

        {activeTab === "sent" && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-white/40">
            <MailPlus className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Sent requests coming soon</p>
            <p className="text-sm">This feature is under development</p>
          </div>
        )}
      </div>
    </div>
  );
}
