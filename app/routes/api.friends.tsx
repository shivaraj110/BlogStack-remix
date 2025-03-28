import { getAuth } from "@clerk/remix/ssr.server";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/.server/db";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  if (!userId) {
    return json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const formData = await args.request.formData();
  const action = formData.get("action")?.toString();
  const targetUserId = formData.get("targetUserId")?.toString();

  if (!action || !targetUserId) {
    return json(
      { status: "error", message: "Missing required fields" },
      { status: 400 }
    );
  }

  // Prevent sending requests to oneself
  if (targetUserId === userId) {
    return json(
      { status: "error", message: "Cannot send friend request to yourself" },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case "send-request":
        // Check if a request already exists in either direction
        const existingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: targetUserId },
              { senderId: targetUserId, receiverId: userId },
            ],
          },
        });

        if (existingRequest) {
          return json(
            {
              status: "error",
              message: "A friend request already exists",
              requestStatus: existingRequest.status,
            },
            { status: 400 }
          );
        }

        // Check if they're already friends
        const existingFriendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId: userId, friendId: targetUserId },
              { userId: targetUserId, friendId: userId },
            ],
          },
        });

        if (existingFriendship) {
          return json(
            { status: "error", message: "Already friends" },
            { status: 400 }
          );
        }

        // Create new friend request
        const newRequest = await prisma.friendRequest.create({
          data: {
            senderId: userId,
            receiverId: targetUserId,
          },
        });

        return json({ status: "success", request: newRequest });

      case "accept-request":
        // Find the request
        const requestToAccept = await prisma.friendRequest.findFirst({
          where: {
            senderId: targetUserId,
            receiverId: userId,
            status: "pending",
          },
        });

        if (!requestToAccept) {
          return json(
            { status: "error", message: "Friend request not found" },
            { status: 404 }
          );
        }

        // Start a transaction to ensure all operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
          // Update request status
          const updatedRequest = await tx.friendRequest.update({
            where: { id: requestToAccept.id },
            data: { status: "accepted" },
          });

          // Create two-way friendship relationships
          const friendship1 = await tx.friendship.create({
            data: {
              userId: userId,
              friendId: targetUserId,
            },
          });

          const friendship2 = await tx.friendship.create({
            data: {
              userId: targetUserId,
              friendId: userId,
            },
          });

          return { updatedRequest, friendship1, friendship2 };
        });

        return json({ status: "success", data: result });

      case "reject-request":
        // Find and update the request
        const updatedRequest = await prisma.friendRequest.updateMany({
          where: {
            senderId: targetUserId,
            receiverId: userId,
            status: "pending",
          },
          data: {
            status: "rejected",
          },
        });

        if (updatedRequest.count === 0) {
          return json(
            { status: "error", message: "Friend request not found" },
            { status: 404 }
          );
        }

        return json({ status: "success", updated: updatedRequest.count });

      case "cancel-request":
        // Cancel a sent request
        const deletedRequest = await prisma.friendRequest.deleteMany({
          where: {
            senderId: userId,
            receiverId: targetUserId,
            status: "pending",
          },
        });

        if (deletedRequest.count === 0) {
          return json(
            { status: "error", message: "Friend request not found" },
            { status: 404 }
          );
        }

        return json({ status: "success", deleted: deletedRequest.count });

      case "remove-friend":
        // Remove both friendship records
        const deletedFriendships = await prisma.friendship.deleteMany({
          where: {
            OR: [
              { userId: userId, friendId: targetUserId },
              { userId: targetUserId, friendId: userId },
            ],
          },
        });

        if (deletedFriendships.count === 0) {
          return json(
            { status: "error", message: "Friendship not found" },
            { status: 404 }
          );
        }

        return json({ status: "success", deleted: deletedFriendships.count });

      default:
        return json(
          { status: "error", message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Friend request error:", error);
    return json(
      { status: "error", message: "Server error processing request" },
      { status: 500 }
    );
  }
};
