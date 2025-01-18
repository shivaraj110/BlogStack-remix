import { prisma } from "./db"

interface BlogData{
    title : string 
    content : string
    authorId : string
    publishDate : string
    imgUrl : string
    tags : string[]
    authorImgUrl : string
}



export const pushBlogs = async({
    title,
    content,authorId,imgUrl,publishDate,tags,authorImgUrl
} : BlogData) => {
    try{
        await prisma.post.create({
            data : {
                title,content,
                authorId,
                imgUrl,
                publishDate,
                tags,authorImgUrl
            }
        })
    }
    catch(e){
        console.error(e);
    }
    }

export const deleteBlog = async(id : number) => {
   try{
    const blog = await prisma.post.delete({
        where : {
            id
        }
    })
    if(blog){
        return true
    }
    return false
   }
   catch(e){
    console.error("error" + e);
   }
}  