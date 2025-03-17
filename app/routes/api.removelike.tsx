import { ActionFunction } from "@remix-run/node";
import { deleteLike } from "~/.server/likes";

export const action: ActionFunction = async (args) => {
  const formData = await args.request.formData();
  const postId = Number(formData.get("postId"));
  const userId = String(formData.get("userId"));
  try {
    const deletedLike = await deleteLike(postId, userId);
    if (deletedLike) {
      return {
        status: "success",
      };
    }
    return {
      status: "failed",
    };
  } catch (e) {
    console.error(e);
    return {
      msg: "failed",
    };
  }
};
