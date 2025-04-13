import { ActionFunction } from "@remix-run/node";
import { Redis } from "@upstash/redis";
import { prisma } from "~/.server/db";
import { getRedisConfig } from "~/lib/url";

export const action: ActionFunction = async (args) => {
  const formData = await args.request.formData();
  const postId = Number(formData.get("postId"));
  const userId = String(formData.get("userId"));
  const redis = new Redis(getRedisConfig());
  await redis.del(`blog:${postId}`);

  try {
    // First find the like
    const like = await prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    });

    // If found, delete it
    if (like) {
      console.log("decreased like count for blog : ", postId);

      const deletedLike = await prisma.like.delete({
        where: {
          id: like.id,
        },
      });
      return { status: "success" };
    } else {
      return { status: "failed", message: "Like not found" };
    }
  } catch (e) {
    console.error(e);
    return {
      msg: "failed",
    };
  }
};
