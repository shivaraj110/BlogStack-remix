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
  const comment = formData.get("comment")?.toString();
  const redis = new Redis(getRedisConfig());
  const postId = formData.get("postId");
  if (!commentId || !comment) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

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
      { error: "You can only edit your own comments" },
      { status: 403 }
    );
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { comment },
  });
  await redis.del(`blog:${postId}`);
  return json({
    comment: updatedComment,
    status: "success",
  });
};
