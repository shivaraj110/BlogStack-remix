import { getAuth } from "@clerk/remix/ssr.server";
import { ActionFunction } from "@remix-run/node";
import { prisma } from "~/.server/db";


export const action :ActionFunction = async (args) => {
    const {userId} = await getAuth(args)
    const formData = await args.request.formData()
    const id = Number(formData.get("id"))
    try{
        const deletedBlog = await prisma.post.delete({
            where : {
                id
            }
        })
        if(deletedBlog){
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
    }
}