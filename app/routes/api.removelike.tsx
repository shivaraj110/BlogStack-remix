import { ActionFunction } from "@remix-run/node";
import { prisma } from "~/.server/db";

export const action: ActionFunction = async (args) => {
  const formData = await args.request.formData();
  const postId = Number(formData.get("postId"));
  const userId = String(formData.get("userId"));
  try {
    const likePushed = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        likes: {
          decrement: 1,
        },
        likedBy: {
          disconnect: {
            identifier: userId,
          },
        },
      },
    });
    return {
      status: "success",
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};
