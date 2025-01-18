import { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
import { pushBookmark } from "~/.server/bookmark";

export const action : ActionFunction = async(args)=>{
    const formData = await args.request.formData()
    const postId = Number(formData.get("postId"))
    const userId = String(formData.get("userId"))
    try{
        const bookmarkPushed = await pushBookmark(postId,userId)
        if(bookmarkPushed){
            alert("bookmark added!")
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
        return null
    }

}