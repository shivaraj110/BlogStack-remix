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
  contentType?: "text" | "image" | "file" | "emoji";
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
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
      createdAt: "asc", // Change to ascending order to get oldest first
    },
    skip: Math.max(totalMessages - page * take, 0), // Calculate skip from the end
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
  const hasMore = totalMessages > page * take;

  return json<LoaderData>({
    messages,
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
  const [isOnline, setIsonline] = useState<boolean>(false)
  const { socket, connected, sendMessage, markAsRead, connectedUsers } = useSocket();
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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;
  const messageMenuRef = useRef<HTMLDivElement | null>(null);


  //get user status


  useEffect(() => {
    const isUserOnline = connectedUsers.includes(otherUser.identifier);
    setIsonline(isUserOnline);
  }, [connectedUsers, otherUser.identifier]);

  // Initialize or reset message tracking when conversation changes
  useEffect(() => {
    processedMessageIds.current = new Set(initialMessages.map((msg) => msg.id));

    // Process messages to ensure they have contentType
    const processedMessages = initialMessages.map((msg) => {
      // If message is from server and doesn't have contentType, try to detect it
      if (!msg.contentType) {
        // Check if it's likely an image (base64 image)
        if (msg.content.startsWith("data:image/")) {
          return { ...msg, contentType: "image" as const };
        }
        // Check if it's likely a file (base64 file)
        else if (
          msg.content.startsWith("data:application/") ||
          msg.content.startsWith("data:text/") ||
          msg.content.includes(";base64,")
        ) {
          return { ...msg, contentType: "file" as const };
        }
        // Default to text
        return { ...msg, contentType: "text" as const };
      }
      return msg;
    });

    setLocalMessages(processedMessages);
    setHasMoreMessages(hasMore);
    setIsAtBottom(true);
    setShowScrollToBottom(false);
    setUnreadCount(0);

    // Scroll to bottom on initial load
    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
  }, [initialMessages, conversation.id, initialPage, hasMore]);

  // Helper function to scroll to bottom
  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "smooth") => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior });
        setIsAtBottom(true);
        setShowScrollToBottom(false);
        setUnreadCount(0);
      }
    },
    []
  );

  // Check if user is scrolled to bottom
  const isScrolledToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const threshold = 100; // pixels from bottom to consider "at bottom"
    return (
      container.scrollHeight - container.clientHeight - container.scrollTop <=
      threshold
    );
  }, []);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversation.id && connected && socket) {
      markAsRead(conversation.id);

      // Also join the conversation-specific room
      socket.emit("join_conversation", conversation.id);
      console.log(`Joining room for conversation ${conversation.id}`);

      // Set up a periodic timer to mark messages as read every 5 seconds
      // This ensures messages get marked as read even if the user is just viewing
      const readInterval = setInterval(() => {
        if (document.visibilityState === "visible") {
          markAsRead(conversation.id);
        }
      }, 5000);

      return () => {
        clearInterval(readInterval);
      };
    }
  }, [conversation.id, connected, markAsRead, socket]);

  // Mark messages as read when new messages are loaded
  useEffect(() => {
    if (conversation.id && connected && socket && localMessages.length > 0) {
      markAsRead(conversation.id);
    }
  }, [localMessages, conversation.id, connected, markAsRead, socket]);

  // Update the socket effect to include better read status handling
  useEffect(() => {
    if (!socket) return;

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
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user?.id ? { ...msg, read: true } : msg
          )
        );
      }
    };

    const handleMessageReceived = (msg: any) => {
      console.log("Received message:", msg);

      if (msg.conversationId !== conversation.id) {
        console.log(
          `Message not for current conversation. Got: ${msg.conversationId}, Expected: ${conversation.id}`
        );
        return false;
      }

      // Extract metadata from the message if available
      const metadata = msg.metadata || {};

      // Convert dates to Date objects for consistency
      const messageWithDateObj = {
        ...msg,
        createdAt: new Date(msg.createdAt),
        // Set content type from metadata or detect from content
        contentType: (metadata.contentType ||
          (msg.content.startsWith("data:image/")
            ? "image"
            : msg.content.includes(";base64,")
              ? "file"
              : "text")) as "text" | "image" | "file" | "emoji",
        fileName: metadata.fileName,
        fileSize: metadata.fileSize,
        mimeType: metadata.mimeType,
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

      setLocalMessages((prev) => {
        // Look for any existing message with matching ID or content/sender
        const existingIndex = prev.findIndex(
          (m) =>
            m.id === messageWithDateObj.id ||
            (m.content === messageWithDateObj.content &&
              m.senderId === messageWithDateObj.senderId &&
              m.conversationId === messageWithDateObj.conversationId)
        );

        if (existingIndex >= 0) {
          // Replace the optimistic message with the real one
          const newMessages = [...prev];
          newMessages[existingIndex] = messageWithDateObj;
          return newMessages;
        }

        return [...prev, messageWithDateObj];
      });

      // Check if we should auto-scroll or show the scroll button
      if (!isScrolledToBottom() && messageWithDateObj.senderId !== user?.id) {
        setShowScrollToBottom(true);
        setUnreadCount((prev) => prev + 1);
      } else if (isAtBottom || messageWithDateObj.senderId === user?.id) {
        // Auto-scroll if we're at bottom or the user sent the message
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }

      // Mark as read if the user is the receiver
      if (messageWithDateObj.receiverId === user?.id && connected) {
        markAsRead(conversation.id);
      }

      return true;
    };

    socket.on("message_received", handleMessageReceived);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("message_received", handleMessageReceived);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [
    socket,
    user?.id,
    conversation.id,
    connected,
    markAsRead,
    isAtBottom,
    scrollToBottom,
    isScrolledToBottom,
  ]);

  // Track scroll position to determine if user is at bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const wasAtBottom = isAtBottom;
      const nowAtBottom = isScrolledToBottom();

      setIsAtBottom(nowAtBottom);

      if (nowAtBottom && showScrollToBottom) {
        setShowScrollToBottom(false);
        setUnreadCount(0);
      }

      // Check if we're near the top to load more messages
      if (
        container.scrollTop < 100 &&
        hasMoreMessages &&
        !isLoadingMore &&
        localMessages.length > 0
      ) {
        console.log("Near top of scroll, loading more messages");
        // Save current scroll position and height
        lastScrollHeight.current = container.scrollHeight;
        lastScrollTop.current = container.scrollTop;

        loadMoreMessages();
      }
    };

    // Add scroll event listener with throttling
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", throttledScroll);
    return () => container.removeEventListener("scroll", throttledScroll);
  }, [
    hasMoreMessages,
    isLoadingMore,
    localMessages.length,
    isAtBottom,
    showScrollToBottom,
    isScrolledToBottom,
  ]);

  // Function to load older messages
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMore || localMessages.length === 0) return;

    try {
      setIsLoadingMore(true);

      // Get the oldest message ID we currently have as our cursor
      const oldestMessage = [...localMessages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];

      const oldestMessageId = oldestMessage.id;
      const oldestMessageDate = new Date(oldestMessage.createdAt).toISOString();

      console.log(
        `Loading messages older than ID: ${oldestMessageId}, date: ${oldestMessageDate}`
      );

      // Use POST to avoid URL length limitations and caching issues
      const response = await fetch(`/api/messages/loadMore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          beforeId: oldestMessageId,
          beforeDate: oldestMessageDate,
          limit: MESSAGES_PER_PAGE,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to load more messages: ${response.status}`);
      }

      const data = await response.json();
      console.log("Loaded message data:", data);

      if (!data.messages || data.messages.length === 0) {
        console.log("No more messages to load");
        setHasMoreMessages(false);
        return;
      }

      // Process new messages
      const newMessages = data.messages;
      newMessages.forEach((msg: Message) => {
        processedMessageIds.current.add(msg.id);
      });

      // Update messages state while preserving order and avoiding duplicates
      setLocalMessages((prev) => {
        // Filter out any duplicates
        const uniqueNewMessages = newMessages.filter(
          (newMsg: Message) =>
            !prev.some((existingMsg) => existingMsg.id === newMsg.id)
        );

        console.log(
          `Adding ${uniqueNewMessages.length} new messages to existing ${prev.length} messages`
        );

        // Sort all messages by createdAt to ensure correct order
        return [...uniqueNewMessages, ...prev].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      // Update if we potentially have more messages
      setHasMoreMessages(data.hasMore);

      // Maintain scroll position after new messages are added
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          const newScrollTop =
            messagesContainerRef.current.scrollHeight -
            lastScrollHeight.current +
            lastScrollTop.current;
          messagesContainerRef.current.scrollTop = newScrollTop;
        }
      });
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

  // Function to handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result || !otherUser || !user) return;

      const base64Content = event.target.result as string;

      handleSendSpecialMessage(
        base64Content,
        "file",
        file.name,
        file.size,
        file.type
      );
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input
  };

  // Function to handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Limit image size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result || !otherUser || !user) return;

      const base64Image = event.target.result as string;

      handleSendSpecialMessage(
        base64Image,
        "image",
        file.name,
        file.size,
        file.type
      );
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input
  };

  // Function to send special message (image, file)
  const handleSendSpecialMessage = async (
    content: string,
    contentType: "image" | "file",
    fileName?: string,
    fileSize?: number,
    mimeType?: string
  ) => {
    if (!otherUser || !user || isSending) return;

    try {
      setIsSending(true);
      console.log(
        `Sending ${contentType} to ${otherUser.identifier} in conversation ${conversation.id}`
      );

      // Create a temporary optimistic ID
      const tempId = Date.now();

      // Optimistically add message to UI with temporary ID
      const optimisticMessage: Message = {
        id: tempId,
        content,
        contentType,
        fileName,
        fileSize,
        mimeType,
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

      // Add to processed set to prevent duplicates when the real message comes back
      processedMessageIds.current.add(tempId);

      // Add new message to the end of the list
      setLocalMessages((prev) => [...prev, optimisticMessage]);

      // Always scroll to bottom when sending a message
      requestAnimationFrame(() => {
        scrollToBottom();
      });

      // Actually send the message
      const metadata = {
        contentType,
        fileName,
        fileSize,
        mimeType,
      };
      await sendMessage(
        otherUser.identifier,
        content,
        conversation.id,
        metadata
      );
      console.log(`${contentType} sent successfully through WebSocket`);
    } catch (error) {
      console.error(`Failed to send ${contentType}:`, error);
    } finally {
      setIsSending(false);
    }
  };

  // Replace the old handleSendMessage function with this updated one
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
        contentType: "text",
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

      // Add to processed set to prevent duplicates when the real message comes back
      processedMessageIds.current.add(tempId);

      // Save message content before clearing the input
      const messageContent = newMessage;

      // Clear input immediately for better UX
      setNewMessage("");

      // Add new message to the end of the list
      setLocalMessages((prev) => [...prev, optimisticMessage]);

      // Always scroll to bottom when sending a message
      requestAnimationFrame(() => {
        scrollToBottom();
      });

      // Actually send the message
      const metadata = { contentType: "text" };
      await sendMessage(
        otherUser.identifier,
        messageContent,
        conversation.id,
        metadata
      );
      console.log("Message sent successfully through WebSocket");
    } catch (error) {
      console.error("Failed to send message:", error);
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

  // Group messages by date, and consecutive messages by the same sender
  const processedMessages = () => {
    const result: {
      [date: string]: {
        groups: Array<{
          senderId: string;
          isFromMe: boolean;
          profile: {
            name: string | null;
            pfpUrl: string | null;
          };
          messages: Message[];
        }>;
      };
    } = {};

    localMessages.forEach((message) => {
      const date = format(new Date(message.createdAt), "MMMM d, yyyy");
      const isFromMe = message.senderId === user?.id;

      if (!result[date]) {
        result[date] = { groups: [] };
      }

      const currentGroups = result[date].groups;
      const lastGroup =
        currentGroups.length > 0
          ? currentGroups[currentGroups.length - 1]
          : null;

      // If the last message was from the same sender, add to that group
      if (lastGroup && lastGroup.senderId === message.senderId) {
        lastGroup.messages.push(message);
      } else {
        // Otherwise create a new group
        currentGroups.push({
          senderId: message.senderId,
          isFromMe,
          profile: {
            name: message.sender.name,
            pfpUrl: message.sender.pfpUrl,
          },
          messages: [message],
        });
      }
    });

    return result;
  };

  const messageDateGroups = processedMessages();

  // Function to render message content based on content type
  const renderMessageContent = (message: Message) => {
    switch (message.contentType) {
      case "image":
        return (
          <div className="image-message">
            <img
              src={message.content}
              alt="Image"
              className="max-w-full rounded-lg max-h-80 object-contain"
              onClick={() => window.open(message.content, "_blank")}
            />
            {message.fileName && (
              <p className="text-xs text-white/60 mt-1">{message.fileName}</p>
            )}
          </div>
        );
      case "file":
        return (
          <div className="file-message flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <div>
              <a
                href={message.content}
                download={message.fileName || "file"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 hover:underline"
              >
                {message.fileName || "Download file"}
              </a>
              {message.fileSize && (
                <p className="text-xs text-white/60">
                  {(message.fileSize / 1024).toFixed(0)} KB
                </p>
              )}
            </div>
          </div>
        );
      default:
        return (
          <p className="text-sm md:text-base whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className="relative flex flex-col w-full h-screen md:h-full overflow-hidden bg-gray-900">
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
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111111] ${isOnline ? "bg-green-500" : "bg-gray-500"
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
                  className={`inline-block mr-1.5 h-1.5 w-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-500"
                    } transition-colors duration-300`}
                ></span>
                {isOnline ? "Online" : "Offline"}
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
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] relative"
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

        {/* Date separators and message groups */}
        {Object.entries(messageDateGroups).map(([date, { groups }]) => (
          <div key={date} className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/5 text-white/60 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {date}
              </div>
            </div>

            <div className="space-y-4">
              {groups.map((group, groupIndex) => (
                <div
                  key={`${date}-${groupIndex}`}
                  className={`flex ${group.isFromMe ? "justify-end" : "justify-start"
                    }`}
                >
                  {/* Sender avatar - only for other people's messages */}
                  {!group.isFromMe && (
                    <div className="h-9 w-9 rounded-full overflow-hidden border border-white/10 mr-2 flex-shrink-0 self-end mb-1">
                      <img
                        src={
                          group.profile.pfpUrl ||
                          "https://via.placeholder.com/40"
                        }
                        alt={group.profile.name || "User"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/40";
                        }}
                      />
                    </div>
                  )}

                  {/* Message group */}
                  <div
                    className={`flex flex-col ${group.isFromMe ? "items-end" : "items-start"
                      } max-w-[75%] md:max-w-[65%] gap-[3px]`}
                  >
                    {/* Sender name - only for others' messages */}
                    {!group.isFromMe && (
                      <div className="text-xs text-white/70 ml-1 mb-0.5">
                        {group.profile.name}
                      </div>
                    )}

                    {/* Message bubbles */}
                    {group.messages.map((message, msgIndex) => {
                      const isFirstInGroup = msgIndex === 0;
                      const isLastInGroup =
                        msgIndex === group.messages.length - 1;
                      const isBeingEdited = editingMessage?.id === message.id;

                      // Calculate bubble styling
                      let bubbleStyle = "";

                      // Base colors
                      if (group.isFromMe) {
                        bubbleStyle =
                          "bg-gradient-to-r from-blue-600 to-blue-500 text-white";
                      } else {
                        bubbleStyle = "bg-[#1e1e1e] text-white";
                      }

                      // Shape for my messages
                      if (group.isFromMe) {
                        if (group.messages.length === 1) {
                          bubbleStyle +=
                            " rounded-tl-2xl rounded-bl-2xl rounded-tr-lg rounded-br-2xl";
                        } else if (isFirstInGroup) {
                          bubbleStyle +=
                            " rounded-tl-2xl rounded-bl-lg rounded-tr-lg rounded-br-lg";
                        } else if (isLastInGroup) {
                          bubbleStyle +=
                            " rounded-tl-lg rounded-bl-2xl rounded-tr-lg rounded-br-2xl";
                        } else {
                          bubbleStyle +=
                            " rounded-tl-lg rounded-bl-lg rounded-tr-lg rounded-br-lg";
                        }
                      }
                      // Shape for other's messages
                      else {
                        if (group.messages.length === 1) {
                          bubbleStyle +=
                            " rounded-tl-lg rounded-bl-2xl rounded-tr-2xl rounded-br-2xl";
                        } else if (isFirstInGroup) {
                          bubbleStyle +=
                            " rounded-tl-lg rounded-bl-lg rounded-tr-2xl rounded-br-lg";
                        } else if (isLastInGroup) {
                          bubbleStyle +=
                            " rounded-tl-lg rounded-bl-2xl rounded-tr-lg rounded-br-2xl";
                        } else {
                          bubbleStyle +=
                            " rounded-tl-lg rounded-bl-lg rounded-tr-lg rounded-br-lg";
                        }
                      }

                      return (
                        <div
                          key={message.id}
                          className="group relative animate-fadeIn"
                        >
                          {/* Message Options Button (only for my messages) */}
                          {group.isFromMe && !isBeingEdited && (
                            <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                                <div className="absolute left-0 mt-1 w-24 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10 message-menu">
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
                            <div className="flex rounded-2xl overflow-hidden bg-gray-700/70 backdrop-blur-sm">
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
                            <div
                              className={`${bubbleStyle} px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200`}
                            >
                              {renderMessageContent(message)}

                              {/* Time stamp - Only show for last message in group */}
                              {isLastInGroup && (
                                <div
                                  className={`flex ${group.isFromMe
                                    ? "justify-end"
                                    : "justify-start"
                                    } items-center mt-0.5`}
                                >
                                  <span className="text-[10px] text-white/60">
                                    {format(
                                      new Date(message.createdAt),
                                      "h:mm a"
                                    )}
                                  </span>

                                  {/* Read receipt - Only for my messages */}
                                  {group.isFromMe && (
                                    <span className="ml-1">
                                      {message.read ? (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="text-green-400"
                                        >
                                          <path d="M20 6L9 17l-5-5"></path>
                                          <path d="M14 6l-3.5 5"></path>
                                        </svg>
                                      ) : connected ? (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="text-white/60"
                                        >
                                          <path d="M20 6L9 17l-5-5"></path>
                                          <path d="M14 6l-3.5 5"></path>
                                        </svg>
                                      ) : (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="text-white/60"
                                        >
                                          <path d="M20 6L9 17l-5-5"></path>
                                        </svg>
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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
              <div className="px-4 py-2 bg-[#1e1e1e] text-white rounded-tl-lg rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm">
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

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <div className="absolute bottom-4 right-4 z-10 animate-fadeIn">
            <button
              onClick={() => scrollToBottom()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-150 transform hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span className="text-xs font-medium">
                {unreadCount > 0
                  ? `${unreadCount} new message${unreadCount > 1 ? "s" : ""}`
                  : "Latest messages"}
              </span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 md:p-4 bg-gradient-to-r from-[#111111] to-[#0d0d0d] border-t border-white/10 backdrop-blur-sm">
        {areFriends ? (
          <form onSubmit={handleSendMessage} className="flex items-center">
            <div className="hidden md:flex space-x-1 mr-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all transform hover:scale-105"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all transform hover:scale-105"
                title="Send image"
              >
                <Image className="h-5 w-5" />
              </button>
            </div>

            <div className="flex md:hidden mr-2">
              {/* Hidden file inputs for mobile */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
                  title="Attach files"
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
