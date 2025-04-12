import { ActionFunctionArgs } from "@remix-run/node";
import { Redis } from "@upstash/redis";
import { prisma } from "~/.server/db";
import { getRedisConfig } from "~/lib/url";

export const action = async (args: ActionFunctionArgs) => {
  try {
    const redis = new Redis(getRedisConfig());
    const formData = await args.request.formData();
    const id = formData.get("id");
    const cacheKey = `blog:${id}`;

    const updatedBlog = await prisma.post.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        author: {
          select: {
            name: true,
            pfpUrl: true,
            email: true,
            identifier: true,
            openToCollab: true,
          },
        },
        likes: true,
        views: true,
        comments: {
          orderBy: {
            commentedAt: "desc",
          },
          include: {
            user: true,
            replies: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    await redis.set(cacheKey, JSON.stringify(updatedBlog));
    console.log("cache updated!");
  } catch (e) {
    console.log(e);
    return {
      status: "failed",
    };
  }
  return {
    status: "sucsess",
  };
};
