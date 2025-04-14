import { ActionFunctionArgs, json } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { prisma } from "~/.server/db";
import { Redis } from "@upstash/redis";
import { getRedisConfig } from "~/lib/url";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  // Authentication check
  const { userId } = await getAuth(args);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the request body
    const body = await request.json();
    const { conversationId, beforeId, beforeDate, limit = 30 } = body;
    const redis = new Redis(getRedisConfig());
    if (!conversationId) {
      return json({ error: "Missing conversationId" }, { status: 400 });
    }

    // Verify the user is part of this conversation
    const userInConversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: {
            identifier: userId,
          },
        },
      },
    });

    if (!userInConversation) {
      return json(
        { error: "Not authorized to view this conversation" },
        { status: 403 }
      );
    }

    //get the cached previous messages
    let messages;
    const cachedMessages = await redis.get(`messages:${conversationId}`);
    if (cachedMessages) {
      messages = JSON.parse(JSON.stringify(cachedMessages));
      console.log("cached messages are being shown");
      // add exipry time
      await redis.expire(`messages:${conversationId}`, 15 * 60);
    } else {
      // Load messages before the specified message ID
      messages = await prisma.message.findMany({
        where: {
          conversationId,
          AND: [
            {
              id: {
                lt: beforeId,
              },
            },
            {
              createdAt: {
                lt: new Date(beforeDate),
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc", // Newest first within the older set
        },
        take: limit,
        include: {
          sender: {
            select: {
              name: true,
              pfpUrl: true,
            },
          },
        },
      });
      await redis.set(`messages:${conversationId}`, JSON.stringify(messages));
      console.log("cached messages");

      await redis.expire(`messages:${conversationId}`, 15 * 60);
    }
    // Count remaining messages for hasMore flag
    const remainingCount = await prisma.message.count({
      where: {
        conversationId,
        AND: [
          {
            id: {
              lt:
                messages.length > 0
                  ? messages[messages.length - 1].id
                  : beforeId,
            },
          },
          {
            createdAt: {
              lt:
                messages.length > 0
                  ? messages[messages.length - 1].createdAt
                  : new Date(beforeDate),
            },
          },
        ],
      },
    });

    return json({
      messages: messages.reverse(), // Reverse to get oldest first
      hasMore: remainingCount > 0,
    });
  } catch (error) {
    console.error("Error loading more messages:", error);
    return json({ error: "Failed to load messages" }, { status: 500 });
  }
};
