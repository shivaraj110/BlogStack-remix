import { ActionFunction } from "@remix-run/node";
import { Redis } from "@upstash/redis";
import { pushLikes } from "~/.server/likes";
import { getRedisConfig } from "~/lib/url";

export const action: ActionFunction = async (args) => {
  const formData = await args.request.formData();
  const postId = Number(formData.get("postId"));
  const userId = String(formData.get("userId"));
  const redis = new Redis(getRedisConfig());
  await redis.del(`blog:${postId}`);

  try {
    const pushedLike = await pushLikes(postId, userId);
    if (pushedLike) {
      console.log("increased like count for blog : ", postId);

      return {
        status: "success",
      };
    }
    return {
      status: "failed",
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};
