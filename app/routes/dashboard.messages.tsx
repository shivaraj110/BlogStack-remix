import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  Link,
  NavLink,
  useParams,
} from "@remix-run/react";
import { useUser } from "@clerk/remix";
import { prisma } from "~/.server/db";
import { format, formatDistanceToNow } from "date-fns";
import {
  MessageSquareText,
  Search,
  User,
  UserCheck,
  UserPlus,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Settings,
  Bell,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Outlet } from "@remix-run/react";
import { useSocket } from "~/hooks/useSocket";

type ConversationWithLatestMessage = {
  id: number;
  updatedAt: Date;
  participants: {
    id: number;
    identifier: string;
    name: string | null;
    pfpUrl: string | null;
  }[];
  latestMessage: {
    content: string;
    createdAt: Date;
    sender: {
      identifier: string;
    };
  } | null;
  unreadCount: number;
};

type LoaderData = {
  conversations: ConversationWithLatestMessage[];
  users: {
    id: number;
    identifier: string;
    name: string | null;
    pfpUrl: string | null;
    email: string;
  }[];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return json({ conversations: [], users: [] });
  }

  // Get all conversations for this user
  const conversations = await prisma.conversation.findMany({
    where: {
      users: {
        some: {
          identifier: userId,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      users: {
        where: {
          identifier: {
            not: userId,
          },
        },
        select: {
          id: true,
          identifier: true,
          name: true,
          pfpUrl: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          sender: {
            select: {
              identifier: true,
            },
          },
        },
      },
    },
  });

  // Get unread count for each conversation
  const conversationsWithData = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          receiverId: userId,
          read: false,
        },
      });

      return {
        id: conversation.id,
        updatedAt: conversation.updatedAt,
        participants: conversation.users,
        latestMessage: conversation.messages[0] || null,
        unreadCount,
      };
    })
  );

  // Get users that the current user might want to message (excluding those already in conversations)
  // We'll limit to users who aren't already in a conversation with this user
  const existingParticipantIds = new Set(
    conversations.flatMap((conv) => conv.users.map((u) => u.identifier))
  );

  // Get all users that the current user can message (except self and existing conversations)
  const users = await prisma.user.findMany({
    where: {
      identifier: {
        not: userId,
        notIn: Array.from(existingParticipantIds),
      },
    },
    select: {
      id: true,
      identifier: true,
      name: true,
      pfpUrl: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 10, // Limiting to 10 users to prevent overwhelming the UI
  });

  return json<LoaderData>({
    conversations: conversationsWithData,
    users,
  });
};

export const meta: MetaFunction = () => {
  return [
    { title: "messages | BlogStack" },
    { name: "description", content: "chat with other authors and friends!" },
  ];
};

export default function MessagesPage() {
  const { conversations: initialConversations, users } =
    useLoaderData<typeof loader>();
  const { user } = useUser();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const params = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMessageAreaLoading, setIsMessageAreaLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);

  const conversationId = params.conversationId;
  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;
  const shouldShowConversationList =
    !isMobileView || (!conversationId && !isMessageAreaLoading);
  const shouldShowMessageArea =
    !isMobileView || conversationId || isMessageAreaLoading;

  // Set initial conversations when they load from the server
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Listen for new messages to update the conversation list
  useEffect(() => {
    if (!socket || !user) return;

    console.log("Setting up message listeners for conversation list");

    const handleNewMessage = (message: any) => {
      console.log("Message received in conversation list component:", message);

      // Update conversation list with the new message
      setConversations((prevConversations) => {
        // Find if we already have this conversation
        const conversationIndex = prevConversations.findIndex(
          (c) => c.id === message.conversationId
        );

        // If the conversation doesn't exist in our list, we need to refresh
        // This is a rare case, but could happen with a new conversation
        if (conversationIndex === -1) {
          // In a real app, you might fetch just the new conversation data
          // For now, we'll just refresh the page to get updated data
          window.location.reload();
          return prevConversations;
        }

        // Make a copy of conversations to modify
        const updatedConversations = [...prevConversations];
        const conversation = { ...updatedConversations[conversationIndex] };

        // Update the latest message
        conversation.latestMessage = {
          content: message.content,
          createdAt: message.createdAt,
          sender: {
            identifier: message.senderId,
          },
        };

        // If this message is for the current user and they're not viewing it,
        // increment the unread count
        if (
          message.receiverId === user.id &&
          (!conversationId ||
            parseInt(conversationId) !== message.conversationId)
        ) {
          conversation.unreadCount += 1;
        }

        // Put this conversation at the top (most recent)
        updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(conversation);

        return updatedConversations;
      });
    };

    // Handle when messages are read in a conversation
    const handleMessagesRead = ({
      userId,
      conversationId,
    }: {
      userId: string;
      conversationId: number;
    }) => {
      if (userId === user.id) {
        setConversations((prevConversations) => {
          return prevConversations.map((conversation) => {
            if (conversation.id === conversationId) {
              return {
                ...conversation,
                unreadCount: 0, // Reset unread count
              };
            }
            return conversation;
          });
        });
      }
    };

    socket.on("message_received", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("message_received", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, user, conversationId]);

  // Set loading state when conversation changes
  useEffect(() => {
    if (conversationId) {
      setIsMessageAreaLoading(true);
      // Reset loading after a short delay
      const timer = setTimeout(() => {
        setIsMessageAreaLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [conversationId]);

  // Automatically mark messages as read when conversation is loaded
  useEffect(() => {
    if (conversationId && socket && connected && user) {
      // Tell the server to mark messages as read
      socket.emit("mark_read", {
        userId: user.id,
        conversationId: parseInt(conversationId),
      });
    }
  }, [conversationId, socket, connected, user]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((convo) => {
    const participantName = convo.participants[0]?.name?.toLowerCase() || "";
    return participantName.includes(searchTerm.toLowerCase());
  });

  // Filter users based on search term
  const filteredUsers = users.filter((u) => {
    const userName = u.name?.toLowerCase() || "";
    const userEmail = u.email.toLowerCase();
    return (
      userName.includes(searchTerm.toLowerCase()) ||
      userEmail.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow flex overflow-hidden">
        {/* Left sidebar - Conversations List */}
        {shouldShowConversationList && (
          <div
            className={`${
              isMobileView ? "w-full" : "w-96"
            } bg-gradient-to-b from-[#111111] to-[#0d0d0d] border-r border-white/10 flex flex-col overflow-hidden`}
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Messages</h2>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      connected ? "bg-green-500" : "bg-red-500"
                    }`}
                    title={connected ? "Connected" : "Disconnected"}
                  ></div>
                  <button
                    className="p-1.5 rounded-full hover:bg-white/10"
                    title="Message settings"
                  >
                    <Settings className="h-4 w-4 text-white/70" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search messages or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 hover:bg-white/10 transition-all text-white placeholder-white/40"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Always show search results first when searching */}
              {searchTerm && (
                <div className="border-b border-white/10 pt-2">
                  <div className="px-4 py-2 text-white/40 text-xs uppercase font-medium flex items-center">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Start New Chat
                  </div>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <Link
                        key={user.identifier}
                        to={`/dashboard/messages/new/${user.identifier}`}
                        className="flex items-center px-4 py-3 hover:bg-white/5 transition-colors rounded-md mx-2 my-1"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={
                                user.pfpUrl || "https://via.placeholder.com/40"
                              }
                              alt={user.name || "User"}
                              className="h-10 w-10 rounded-full border border-white/10 object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/40";
                              }}
                            />
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full border border-[#0d0d0d]">
                              <UserPlus className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">{user.name}</span>
                            </div>
                            <p className="text-sm text-white/50">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-20 text-white/50">
                      <p>No users found</p>
                      <p className="text-sm">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}

              {/* Show recent conversations section */}
              <div className="px-4 py-2 text-white/40 text-xs uppercase font-medium flex items-center">
                <MessageSquareText className="h-3 w-3 mr-1" />
                Recent Conversations
              </div>

              {filteredConversations.length === 0 && searchTerm === "" ? (
                <div className="flex flex-col items-center justify-center h-40 text-white/50">
                  <MessageSquareText className="h-10 w-10 mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Search for users to start chatting</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-white/50">
                  <User className="h-10 w-10 mb-2 opacity-50" />
                  <p>No matching conversations</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const participant = conversation.participants[0];
                  const isLatestMessageFromMe =
                    conversation.latestMessage?.sender.identifier === user?.id;
                  const msgTime = conversation.latestMessage?.createdAt;
                  const timeDisplay = msgTime
                    ? new Date(msgTime).toDateString() ===
                      new Date().toDateString()
                      ? format(new Date(msgTime), "h:mm a")
                      : format(new Date(msgTime), "MMM d")
                    : "";

                  return (
                    <NavLink
                      key={conversation.id}
                      to={`/dashboard/messages/${conversation.id}`}
                      className={({ isActive }) => `
                        block px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors relative
                        ${isActive ? "bg-white/10" : ""}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={
                              participant?.pfpUrl ||
                              "https://via.placeholder.com/40"
                            }
                            alt={participant?.name || "User"}
                            className="h-12 w-12 rounded-full border border-white/10 object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/40";
                            }}
                          />
                          {conversation.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-xs text-white h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#0d0d0d]">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium truncate">
                              {participant?.name}
                            </h3>
                            <span className="text-xs text-white/40">
                              {timeDisplay}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 truncate">
                            {conversation.latestMessage ? (
                              <>
                                {isLatestMessageFromMe && (
                                  <span className="font-medium text-white/40 mr-1">
                                    You:
                                  </span>
                                )}
                                {conversation.latestMessage.content}
                              </>
                            ) : (
                              <span className="italic text-white/30">
                                No messages yet
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </NavLink>
                  );
                })
              )}

              {/* Suggested users section */}
              {!searchTerm && users.length > 0 && (
                <div className="mt-4">
                  <div className="px-4 py-2 text-white/40 text-xs uppercase font-medium flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    Suggested Users
                  </div>
                  <div className="px-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      {users.slice(0, 5).map((user) => (
                        <Link
                          key={user.identifier}
                          to={`/dashboard/messages/new/${user.identifier}`}
                          className="flex items-center p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <img
                            src={
                              user.pfpUrl || "https://via.placeholder.com/32"
                            }
                            alt={user.name || "User"}
                            className="h-7 w-7 rounded-full mr-2 border border-white/10 object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/32";
                            }}
                          />
                          <span className="text-sm font-medium truncate">
                            {user.name}
                          </span>
                          <UserPlus className="h-3 w-3 ml-1 text-blue-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main content area */}
        {shouldShowMessageArea && (
          <div className="flex-1 bg-[#0a0a0a] relative">
            {isMobileView && conversationId && (
              <button
                onClick={() => navigate("/dashboard/messages")}
                className="absolute z-10 top-4 left-4 p-2 bg-white/10 rounded-full text-white/70"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            {isMessageAreaLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : !conversationId ? (
              <div className="h-full flex flex-col items-center justify-center text-white/50">
                <MessageSquareText className="h-16 w-16 mb-4 opacity-30" />
                <h3 className="text-xl font-medium mb-2">Your Messages</h3>
                <p className="text-center max-w-md px-4">
                  Select a conversation from the sidebar or search for a user to
                  start chatting
                </p>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
