import { ActionFunction } from "@remix-run/node";
import { deleteBookmark } from "~/.server/bookmark";

export const action : ActionFunction = async(args)=>{
    const formData = await args.request.formData()
    const postId = Number(formData.get("postId"))
    const userId = String(formData.get("userId"))
    try{
        const bookmarkDeleted = await deleteBookmark(postId,userId)
        if(bookmarkDeleted){
            return {
                status : "success"
            }
        }
        return {
            status : "failed"
        }
    }
    catch(e){
        console.error(e);
        return{
            msg: "failed"
        }
    }

}