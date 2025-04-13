import { getAuth } from "@clerk/remix/ssr.server";
import { ActionFunction, json } from "@remix-run/node";
import { Redis } from "@upstash/redis";
import { prisma } from "~/.server/db";
import { getRedisConfig } from "~/lib/url";

export const action: ActionFunction = async (args) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await args.request.formData();
  const commentId = Number(formData.get("commentId"));
  const postId = Number(formData.get("postId"));
  if (!commentId) {
    return json({ error: "Missing comment ID" }, { status: 400 });
  }
  const redis = new Redis(getRedisConfig());

  // Verify the comment belongs to the user
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!existingComment) {
    return json({ error: "Comment not found" }, { status: 404 });
  }

  if (existingComment.userId !== userId) {
    return json(
      { error: "You can only delete your own comments" },
      { status: 403 }
    );
  }

  // First delete all replies associated with this comment
  await prisma.replies.deleteMany({
    where: { commentId: commentId },
  });

  // Then delete the comment
  await prisma.comment.delete({
    where: { id: commentId },
  });
  await redis.del(`blog:${postId}`);
  return json({
    status: "success",
    message: "Comment deleted successfully",
  });
};
