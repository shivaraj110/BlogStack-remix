import { ActionFunction } from "@remix-run/node";
import { pushLikes } from "~/.server/likes";

export const action: ActionFunction = async (args) => {
  const formData = await args.request.formData();
  const postId = Number(formData.get("postId"));
  const userId = String(formData.get("userId"));
  try {
    const pushedLike = await pushLikes(postId, userId);
    if (pushedLike) {
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
