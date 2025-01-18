import { prisma } from "./db";

export const pushBookmark = async(postId : number,userId:string) => {
    try{
       const bookmark =  await prisma.bookmark.create({
            data : {
                userId,
                postId
            }
        })
        if(bookmark){
            return true
        } 
        return false
    }
    catch(e){
        console.error(e);
        return null
    }
}


export const deleteBookmark = async(postId:number,userId:string
) => {
  const id = await getBookmarkId(userId,postId)
    try{
     const del = await prisma.bookmark.delete({
        where : {
            postId,
            userId,
            id
        }
      })
      if(del){
        return true
      }
      return false
    }
    catch(e){
        console.error(e);
        return null
    }
}


export const getBookmarks = async (userId : string) => {
    try {
        const bookmarks = await prisma.bookmark.findMany({
            where : {
                userId
            },
            select : {
                id : true,
                post : {
                    select : {
                        id : true,
                        title : true, 
                        content : true,
                        authorId : true,
                        publishDate : true,
                        likes : true,
                        imgUrl : true,
                        authorImgUrl : true,
                        tags :true,
                        author : {
                            select : {
                                name : true
                            }
                        }
                    }
                },

                userId:true,
                postId:true,
            }
        })
        return bookmarks
    }
    catch(e){
        console.error(e);
        
    }
}

const getBookmarkId = async (userId :string , postId :number) => {
    const bookmark = await prisma.bookmark.findFirst({
        where : {
            postId,
            userId
        },
        select : {
            id : true
        }
    })
    return bookmark?.id
}