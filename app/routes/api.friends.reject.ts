import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { prisma } from "~/.server/db";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (args.request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { requestId } = await args.request.json();

    // Get the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return json({ error: "Friend request not found" }, { status: 404 });
    }

    // Verify the user is the receiver of the request
    if (friendRequest.receiverId !== userId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update friend request status to rejected
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    // If there was a friendship, remove it
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
          {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        ],
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    return json({ error: "Failed to reject friend request" }, { status: 500 });
  }
};
