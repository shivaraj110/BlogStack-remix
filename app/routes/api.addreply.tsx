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
  const content = formData.get("content")?.toString();
  const postId = Number(formData.get("postId"));
  const redis = new Redis(getRedisConfig());
  await redis.del(`blog:${postId}`);
  console.log("deleted chache" + postId);

  if (!commentId || !content) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the parent comment exists
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment) {
    return json({ error: "Parent comment not found" }, { status: 404 });
  }

  // Create the reply with content field
  const reply = await prisma.replies.create({
    data: {
      userId: userId,
      commentId: commentId,
      content: content,
    },
    include: {
      user: true,
    },
  });

  return json({
    reply,
    status: "success",
  });
};
