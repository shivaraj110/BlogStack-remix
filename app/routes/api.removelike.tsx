import { ActionFunction } from "@remix-run/node";
import { prisma } from "~/.server/db";

export const action: ActionFunction = async (args) => {
  const formData = await args.request.formData();
  const postId = Number(formData.get("postId"));
  const userId = String(formData.get("userId"));
  const id = Number(formData.get("id"));
  try {
    const removedLike = await prisma.like.delete({
      where: {
        id,
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
