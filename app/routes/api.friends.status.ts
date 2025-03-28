import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { prisma } from "~/.server/db";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(args.request.url);
  const targetUserId = url.searchParams.get("userId");

  if (!targetUserId) {
    return json({ error: "Missing userId parameter" }, { status: 400 });
  }

  try {
    // Check if users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });

    return json({ isFriend: !!friendship });
  } catch (error) {
    console.error("Error checking friendship status:", error);
    return json(
      { error: "Failed to check friendship status" },
      { status: 500 }
    );
  }
};
