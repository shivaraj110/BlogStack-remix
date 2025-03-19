import { LoaderFunction, json } from "@remix-run/node";
import { prisma } from "~/.server/db";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const postId = Number(url.searchParams.get("postId"));
  const userId = url.searchParams.get("userId");

  if (!postId || !userId) {
    return json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    // Check if a like exists for this user and post
    const like = await prisma.like.findFirst({
      where: {
        postId,
        userId,
      },
    });

    return json({ isLiked: !!like });
  } catch (error) {
    console.error("Error checking like status:", error);
    return json({ error: "Error checking like status" }, { status: 500 });
  }
};
