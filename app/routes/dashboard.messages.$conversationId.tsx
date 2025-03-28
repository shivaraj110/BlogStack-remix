import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useUser } from "@clerk/remix";
import { prisma } from "~/.server/db";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Send,
  Paperclip,
  Image,
  Smile,
  Mic,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useSocket } from "~/hooks/useSocket";

// Number of messages to load per page
const MESSAGES_PER_PAGE = 30;

type Message = {
  id: number;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: number;
  read: boolean;
  createdAt: string | Date;
  sender: {
    name: string | null;
    pfpUrl: string | null;
  };
};

// Define a simpler user type for our purposes
type ConversationUser = {
  id: number;
  identifier: string;
  name: string | null;
  pfpUrl: string | null;
  friendsWith: any[];
};

// Define a type for our conversation with users
type ExtendedConversation = {
  id: number;
  users: ConversationUser[];
  [key: string]: any;
};

type Participant = {
  id: number;
  identifier: string;
  name: string | null;
  pfpUrl: string | null;
  friendsWith?: any[];
};

type LoaderData = {
  messages: Message[];
  conversation: {
    id: number;
    participants: Participant[];
  };
  hasMore: boolean;
  page: number;
  totalMessages: number;
  areFriends: boolean;
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const conversationId = parseInt(args.params.conversationId || "0");

  // Get pagination parameters
  const url = new URL(args.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const take = MESSAGES_PER_PAGE;
  const skip = (page - 1) * take;

  if (!userId || !conversationId) {
    return json({
      messages: [],
      conversation: { id: 0, participants: [] },
      hasMore: false,
      page: 1,
      totalMessages: 0,
      areFriends: false,
    });
  }

  // Using any type to bypass TypeScript checks
  const rawConversation = (await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      users: {
        some: {
          identifier: userId,
        },
      },
    },
    include: {
      users: {
        where: {
          identifier: {
            not: userId,
          },
        },
        // Using a simpler approach to get all user data
        select: {
          id: true,
          identifier: true,
          name: true,
          pfpUrl: true,
        },
      },
    },
  })) as any;

  if (!rawConversation) {
    return json<LoaderData>({
      messages: [],
      conversation: { id: 0, participants: [] },
      hasMore: false,
      page: 1,
      totalMessages: 0,
      areFriends: false,
    });
  }

  // Check if users are friends
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId, friendId: rawConversation.users[0].identifier },
        { userId: rawConversation.users[0].identifier, friendId: userId },
      ],
      status: "ACCEPTED",
    },
  });

  const areFriends = !!friendship;

  // Get total count of messages for pagination info
  const totalMessages = await prisma.message.count({
    where: {
      conversationId,
    },
  });

  // Get paginated messages for this conversation
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "desc", // Descending to get most recent first
    },
    skip,
    take,
    include: {
      sender: {
        select: {
          name: true,
          pfpUrl: true,
        },
      },
    },
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      receiverId: userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  // Determine if there are more messages to load
  const hasMore = skip + messages.length < totalMessages;

  return json<LoaderData>({
    messages: messages.reverse(),
    conversation: {
      id: rawConversation.id,
      participants: rawConversation.users,
    },
    hasMore,
    page,
    totalMessages,
    areFriends,
  });
};

export default function ConversationPage() {
  const {
    messages: initialMessages,
    conversation,
    hasMore,
    page: initialPage,
    totalMessages,
    areFriends,
  } = useLoaderData<typeof loader>();
  const { user } = useUser();
  const { socket, connected, sendMessage, markAsRead } = useSocket();
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState<number | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMoreMessages, setHasMoreMessages] = useState(hasMore);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const otherUser = conversation.participants[0];
  const processedMessageIds = useRef(new Set<number>());
  const lastScrollHeight = useRef(0);
  const lastScrollTop = useRef(0);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset message tracking when conversation changes
  useEffect(() => {
    processedMessageIds.current = new Set(initialMessages.map((msg) => msg.id));
    setLocalMessages(initialMessages);
    setCurrentPage(initialPage);
    setHasMoreMessages(hasMore);
  }, [initialMessages, conversation.id, initialPage, hasMore]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversation.id && connected && socket) {
      markAsRead(conversation.id);

      // Also join the conversation-specific room
      socket.emit("join_conversation", conversation.id);
      console.log(`Joining room for conversation ${conversation.id}`);
    }
  }, [conversation.id, connected, markAsRead, socket]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    console.log(
      `Setting up message listeners for conversation ${conversation.id}`
    );

    const handleNewMessage = (msg: any) => {
      console.log("Received message:", msg);

      // Skip if the message isn't for this conversation
      if (msg.conversationId !== conversation.id) {
        console.log(
          `Message not for current conversation. Got: ${msg.conversationId}, Expected: ${conversation.id}`
        );
        return false;
      }

      // Convert dates to Date objects for consistency
      const messageWithDateObj = {
        ...msg,
        createdAt: new Date(msg.createdAt),
      };

      // Skip if already processed this message (by ID)
      if (processedMessageIds.current.has(messageWithDateObj.id)) {
        console.log(
          "Skipping already processed message:",
          messageWithDateObj.id
        );
        return false;
      }

      // Add to processed set
      processedMessageIds.current.add(messageWithDateObj.id);

      // Check if this is a real message that corresponds to an optimistic one
      // we already added (based on content and sender)
      setLocalMessages((prev) => {
        // Look for any existing message with the same content from the same sender
        const duplicateIndex = prev.findIndex(
          (m) =>
            m.content === messageWithDateObj.content &&
            m.senderId === messageWithDateObj.senderId &&
            m.conversationId === messageWithDateObj.conversationId
        );

        if (duplicateIndex >= 0) {
          console.log("Found duplicate message, replacing with server version");
          // Replace the optimistic message with the real one
          const newMessages = [...prev];
          newMessages[duplicateIndex] = messageWithDateObj;
          return newMessages;
        }

        // No duplicate found, add this as a new message
        console.log("No duplicate found, adding new message to UI");
        return [...prev, messageWithDateObj];
      });

      // Mark as read if the user is the receiver
      if (messageWithDateObj.receiverId === user?.id && connected) {
        console.log("Marking incoming message as read");
        markAsRead(conversation.id);
      }

      setIsTyping(false);
      return true;
    };

    const handleMessagesRead = ({
      userId,
      conversationId,
    }: {
      userId: string;
      conversationId: number;
    }) => {
      console.log(
        `Messages read event: user=${userId}, conversation=${conversationId}`
      );

      if (conversationId === conversation.id && userId !== user?.id) {
        console.log("Updating read status for messages");
        // Update message read status
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user?.id ? { ...msg, read: true } : msg
          )
        );
      }
    };

    const handleTyping = ({
      conversationId,
      userId,
    }: {
      conversationId: number;
      userId: string;
    }) => {
      console.log(
        `Typing event: user=${userId}, conversation=${conversationId}`
      );

      if (conversationId === conversation.id && userId !== user?.id) {
        setIsTyping(true);

        // Clear typing indicator after 3 seconds
        if (typingTimeout) clearTimeout(typingTimeout);
        const timeout = setTimeout(() => setIsTyping(false), 3000);
        setTypingTimeout(timeout);
      }
    };

    // Register event handlers
    socket.on("message_received", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      // Clean up event listeners
      socket.off("message_received", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("messages_read", handleMessagesRead);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [socket, user?.id, conversation.id, connected, markAsRead, typingTimeout]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    // Only auto-scroll to bottom if user was already at the bottom
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages, isTyping]);

  // Handle scroll to load more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      // Load more when scrolling to top (threshold of 50px)
      if (container.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
        // Save current scroll position
        lastScrollHeight.current = container.scrollHeight;
        lastScrollTop.current = container.scrollTop;

        await loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMoreMessages, currentPage, isLoadingMore, conversation.id]);

  // After loading more messages, restore scroll position
  useEffect(() => {
    if (!isLoadingMore && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const newScrollTop =
        container.scrollHeight -
        lastScrollHeight.current +
        lastScrollTop.current;

      // Set scroll position to maintain relative position after new content loads
      container.scrollTop = newScrollTop;
    }
  }, [isLoadingMore, localMessages.length]);

  // Function to load older messages
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      const response = await fetch(
        `/dashboard/messages/${conversation.id}?page=${nextPage}`
      );
      if (!response.ok) throw new Error("Failed to load more messages");

      const data = await response.json();

      // Add newly loaded messages to the top
      const newMessages = data.messages;

      // Update processed message IDs
      newMessages.forEach((msg: Message) => {
        processedMessageIds.current.add(msg.id);
      });

      // Add new messages to the beginning of the array
      setLocalMessages((prev) => [...newMessages, ...prev]);
      setCurrentPage(nextPage);
      setHasMoreMessages(data.hasMore);
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Function to handle edit message
  const handleEditMessage = async () => {
    if (!editingMessage || !editingMessage.content.trim() || !user || isEditing)
      return;

    try {
      setIsEditing(true);

      // Only allow editing own messages
      if (editingMessage.senderId !== user.id) {
        setEditingMessage(null);
        return;
      }

      // Optimistically update the message in UI
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessage.id
            ? { ...msg, content: editingMessage.content }
            : msg
        )
      );

      if (socket && connected) {
        // Emit edit message event
        socket.emit("edit_message", {
          messageId: editingMessage.id,
          content: editingMessage.content,
          conversationId: conversation.id,
          userId: user.id,
        });

        console.log(
          `Edited message ${editingMessage.id} in conversation ${conversation.id}`
        );
      }

      // Clear editing state
      setEditingMessage(null);
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      setIsEditing(false);
    }
  };

  // Function to handle delete message
  const handleDeleteMessage = async (messageId: number) => {
    if (!user || isDeleting) return;

    try {
      setIsDeleting(true);

      // Get the message to delete
      const messageToDelete = localMessages.find((msg) => msg.id === messageId);

      // Only allow deleting own messages
      if (!messageToDelete || messageToDelete.senderId !== user.id) {
        return;
      }

      // Optimistically remove the message from UI
      setLocalMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      if (socket && connected) {
        // Emit delete message event
        socket.emit("delete_message", {
          messageId,
          conversationId: conversation.id,
          userId: user.id,
        });

        console.log(
          `Deleted message ${messageId} in conversation ${conversation.id}`
        );
      }

      // Close any open message menu
      setMessageMenuOpen(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to send friend request
  const handleSendFriendRequest = async () => {
    if (!user || !otherUser || friendRequestSent) return;

    try {
      setFriendRequestSent(true);

      if (socket && connected) {
        // Emit friend request event
        socket.emit("send_friend_request", {
          fromUserId: user.id,
          toUserId: otherUser.identifier,
        });

        console.log(`Sent friend request to ${otherUser.identifier}`);
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
      setFriendRequestSent(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUser || !user || isSending) return;

    try {
      setIsSending(true);
      console.log(
        `Sending message to ${otherUser.identifier} in conversation ${conversation.id}`
      );

      // Create a temporary optimistic ID
      const tempId = Date.now();

      // Optimistically add message to UI with temporary ID
      const optimisticMessage: Message = {
        id: tempId,
        content: newMessage,
        senderId: user.id,
        receiverId: otherUser.identifier,
        conversationId: conversation.id,
        read: false,
        createdAt: new Date(),
        sender: {
          name: user.fullName || null,
          pfpUrl: user.imageUrl || null,
        },
      };

      console.log("Optimistic message:", optimisticMessage);

      // Add to processed set to prevent duplicates when the real message comes back
      processedMessageIds.current.add(tempId);

      // Save message content before clearing the input
      const messageContent = newMessage;

      // Clear input immediately for better UX
      setNewMessage("");
      setLocalMessages((prev) => [...prev, optimisticMessage]);

      // Actually send the message
      await sendMessage(otherUser.identifier, messageContent, conversation.id);
      console.log("Message sent successfully through WebSocket");
    } catch (error) {
      console.error("Failed to send message:", error);
      // You could add error handling here, like showing a notification
      // or adding a "failed" indicator to the message
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (socket && connected && conversation.id && user) {
      socket.emit("typing", {
        conversationId: conversation.id,
        userId: user.id,
      });
    }
  };

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageMenuOpen !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest(".message-menu")) {
          setMessageMenuOpen(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [messageMenuOpen]);

  // Focus on edit input when editing a message
  useEffect(() => {
    if (editingMessage && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessage]);

  // Add socket listeners for message edits and deletes
  useEffect(() => {
    if (!socket) return;

    const handleMessageEdit = (data: any) => {
      if (data.conversationId !== conversation.id) return;

      console.log(`Message edited: ${data.messageId}`);

      // Update the message in the UI
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, content: data.content } : msg
        )
      );
    };

    const handleMessageDelete = (data: any) => {
      if (data.conversationId !== conversation.id) return;

      console.log(`Message deleted: ${data.messageId}`);

      // Remove the message from the UI
      setLocalMessages((prev) =>
        prev.filter((msg) => msg.id !== data.messageId)
      );
    };

    const handleFriendRequest = (data: any) => {
      console.log("Friend request received:", data);
      // You could show a notification here
    };

    // Register event handlers
    socket.on("message_edited", handleMessageEdit);
    socket.on("message_deleted", handleMessageDelete);
    socket.on("friend_request_received", handleFriendRequest);

    return () => {
      // Clean up event listeners
      socket.off("message_edited", handleMessageEdit);
      socket.off("message_deleted", handleMessageDelete);
      socket.off("friend_request_received", handleFriendRequest);
    };
  }, [socket, conversation.id]);

  // Check friendship status
  useEffect(() => {
    const checkFriendshipStatus = async () => {
      if (!user || !otherUser) return;

      try {
        const response = await fetch(
          `/api/friends/status?userId=${otherUser.identifier}`
        );
        const data = await response.json();
        setIsFriend(data.isFriend);
      } catch (error) {
        console.error("Error checking friendship status:", error);
      }
    };

    checkFriendshipStatus();
  }, [user, otherUser]);

  // Listen for friend request events
  useEffect(() => {
    if (!socket || !connected) return;

    socket.on("friend_request_sent", (data) => {
      if (data.status === "PENDING") {
        setFriendRequestSent(true);
      }
    });

    socket.on("friend_request_received", (data) => {
      // Handle incoming friend requests if needed
    });

    return () => {
      socket.off("friend_request_sent");
      socket.off("friend_request_received");
    };
  }, [socket, connected]);

  if (!otherUser) {
    return (
      <div className="h-full flex items-center justify-center text-white/50">
        <div className="text-center">
          <p>Conversation not found</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  localMessages.forEach((message) => {
    const date = format(new Date(message.createdAt), "MMMM d, yyyy");
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Conversation header */}
      <div className="p-3 md:p-4 border-b border-white/10 bg-gradient-to-r from-[#111111] to-[#0f0f0f] backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/10">
                <img
                  src={otherUser.pfpUrl || "https://via.placeholder.com/40"}
                  alt={otherUser.name || "User"}
                  className="h-full w-full object-cover transition-opacity duration-200 hover:opacity-90"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/40";
                  }}
                />
              </div>
              <div
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111111] ${
                  connected ? "bg-green-500" : "bg-gray-500"
                } transition-colors duration-300`}
              ></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sm md:text-base">
                  {otherUser.name}
                </h3>
                {areFriends ? (
                  <div className="flex items-center text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3 h-3 mr-1"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-xs">Friends</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={friendRequestSent}
                    className="flex items-center text-blue-500 hover:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-full transition-all duration-200"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    <span className="text-xs">
                      {friendRequestSent ? "Request Sent" : "Add Friend"}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-xs md:text-sm text-white/60 flex items-center">
                <span
                  className={`inline-block mr-1.5 h-1.5 w-1.5 rounded-full ${
                    connected ? "bg-green-500" : "bg-gray-500"
                  } transition-colors duration-300`}
                ></span>
                {connected ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
              title="Call"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </button>
            <button
              className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
              title="More options"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Friendship status banner - show if not friends */}
      {!areFriends && (
        <div className="bg-yellow-500/10 p-2 text-center flex items-center justify-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <p className="text-yellow-500 text-xs md:text-sm">
            You are not friends with this user
          </p>
          <button
            onClick={handleSendFriendRequest}
            disabled={friendRequestSent}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors flex items-center"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            {friendRequestSent ? "Request Sent" : "Add Friend"}
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-1 custom-scrollbar bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]"
      >
        {/* Loading indicator for more messages */}
        {isLoadingMore && (
          <div className="flex justify-center my-2">
            <div className="bg-white/5 rounded-full p-2">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            </div>
          </div>
        )}

        {/* "Load More" button shown when near the top */}
        {hasMoreMessages && !isLoadingMore && (
          <div className="flex justify-center my-2">
            <button
              onClick={loadMoreMessages}
              className="px-4 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-full text-white/70 transition-all duration-150 
                         transform hover:scale-105 hover:shadow-md hover:shadow-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              Load older messages
            </button>
          </div>
        )}

        {/* Messages by date */}
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="mb-4 space-y-3">
            <div className="flex items-center justify-center mb-2">
              <div className="bg-white/5 text-white/60 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {date}
              </div>
            </div>
            {msgs.map((message, idx) => {
              const isFromMe = message.senderId === user?.id;
              const isConsecutive =
                idx > 0 && msgs[idx - 1].senderId === message.senderId;
              const isBeingEdited = editingMessage?.id === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex animate-fadeIn ${
                    isFromMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`group flex max-w-[85%] md:max-w-[75%] ${
                      isConsecutive && !isFromMe ? "pl-10" : ""
                    }`}
                  >
                    {!isFromMe && !isConsecutive && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10 bg-gray-800">
                          <img
                            src={
                              message.sender.pfpUrl ||
                              "https://via.placeholder.com/40"
                            }
                            alt={message.sender.name || "User"}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/40";
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div
                      className={`${
                        !isFromMe && !isConsecutive ? "ml-2" : ""
                      } ${!isFromMe && isConsecutive ? "ml-0" : ""} relative`}
                    >
                      {/* Message Options Button (only for my messages) */}
                      {isFromMe && !isBeingEdited && (
                        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() =>
                              setMessageMenuOpen((prev) =>
                                prev === message.id ? null : message.id
                              )
                            }
                            className="p-1 bg-gray-800/70 hover:bg-gray-800 rounded-full backdrop-blur-sm text-white/70 hover:text-white transition-colors"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </button>

                          {/* Message Menu */}
                          {messageMenuOpen === message.id && (
                            <div className="absolute right-0 mt-1 w-24 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10 message-menu">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setEditingMessage(message);
                                    setMessageMenuOpen(null);
                                  }}
                                  className="w-full flex items-center px-4 py-2 text-xs text-white hover:bg-gray-700 transition-colors"
                                >
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteMessage(message.id)
                                  }
                                  className="w-full flex items-center px-4 py-2 text-xs text-red-400 hover:bg-gray-700 transition-colors"
                                >
                                  <Trash className="h-3 w-3 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      {isBeingEdited ? (
                        <div className="mt-1 mb-1 flex rounded-2xl overflow-hidden bg-gray-700/70 backdrop-blur-sm">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingMessage.content}
                            onChange={(e) =>
                              setEditingMessage({
                                ...editingMessage,
                                content: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 bg-transparent text-white text-sm outline-none"
                            autoFocus
                          />
                          <div className="flex">
                            <button
                              onClick={handleEditMessage}
                              disabled={isEditing}
                              className="px-2 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {isEditing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Edit className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingMessage(null)}
                              className="px-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`px-3 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${
                              isFromMe
                                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-none hover:shadow-blue-900/20"
                                : "bg-[#1a1a1a] text-white rounded-tl-none hover:bg-[#222222]"
                            } ${
                              isConsecutive
                                ? isFromMe
                                  ? "rounded-tr-2xl"
                                  : "rounded-tl-2xl"
                                : ""
                            }`}
                          >
                            <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                          <div
                            className={`text-xs mt-1 text-white/40 ${
                              isFromMe ? "text-right" : "text-left"
                            }`}
                          >
                            {format(new Date(message.createdAt), "h:mm a")}
                            {isFromMe && (
                              <span className="ml-1.5">
                                {message.read ? (
                                  <span className="inline-flex items-center">
                                    •{" "}
                                    <span className="text-blue-400 ml-1">
                                      Read
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center">
                                    •{" "}
                                    <span className="text-white/40 ml-1">
                                      Sent
                                    </span>
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex mb-2 justify-start animate-fadeIn">
            <div className="flex">
              <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10 mr-2 flex-shrink-0">
                <img
                  src={otherUser.pfpUrl || "https://via.placeholder.com/40"}
                  alt={otherUser.name || "User"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/40";
                  }}
                />
              </div>
              <div className="px-4 py-2 bg-[#1a1a1a] text-white rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex space-x-1 items-center">
                  <div className="h-2 w-2 bg-white/70 rounded-full animate-typing"></div>
                  <div
                    className="h-2 w-2 bg-white/70 rounded-full animate-typing"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-white/70 rounded-full animate-typing"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 md:p-4 bg-gradient-to-r from-[#111111] to-[#0d0d0d] border-t border-white/10 backdrop-blur-sm">
        {areFriends ? (
          <form onSubmit={handleSendMessage} className="flex items-center">
            <div className="hidden md:flex space-x-1 mr-2">
              <button
                type="button"
                className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all transform hover:scale-105"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all transform hover:scale-105"
                title="Send image"
              >
                <Image className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all transform hover:scale-105"
                title="Send emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>

            <div className="flex md:hidden mr-2">
              <button
                type="button"
                className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
                title="Attachments"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </button>
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm md:text-base text-white placeholder-white/40 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="p-2 ml-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full text-white 
                       disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-600 
                       transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:animate-bounce"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <div className="flex items-center text-white/50 text-sm">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
              <p>You need to be friends to send messages</p>
            </div>
            <button
              onClick={handleSendFriendRequest}
              disabled={friendRequestSent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {friendRequestSent
                ? "Friend Request Sent"
                : "Send Friend Request"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
