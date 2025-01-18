import { getAuth } from "@clerk/remix/ssr.server"
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { getBookmarks } from "~/.server/bookmark"
import BookmarkedBlogPost from "~/components/BookMarkBlogs"

export const loader:LoaderFunction = async(args : LoaderFunctionArgs) => {
    const {userId} = await getAuth(args)
  try{
    const blogs = await getBookmarks(userId ?? "")
    return {
      status : "success",
      body : blogs
    }
  }
  catch (e){
    console.error(e);
    return {
      status : "fail",
    }
  }
} 



export default function(){
//   pushBlogs({
//     title : "asdasd",
//     content :"asd",
//     likes : 69,
//     publishDate : "12th dec 2024",
//     authorId : 1,
//     imgUrl : "asdasd"
// })
interface BlogData{
  post : {
  title : string 
  content : string
  authorId : number
  publishDate : string
  likes : number
  imgUrl : string,
  authorImgUrl : string,
  tags : string[],
author : {
name : string
},id : string
}
}
  const {body}= useLoaderData<typeof loader>()
  const blogs:BlogData[] = body

if( !body[0] ){
  return <div className="p-5 flex">
    No Bookmarks yet! Be the first one to <Link to={"/dashboard/blogs"} className="underline px-1 cursor-pointer">add Bookmarks</Link>!
  </div>
}

return (
  <div className="p-1 max-w-7xl mx-auto">
    <div className="flex flex-col">
      <div className="mt-6">
        {blogs.map((b) => (
          <BookmarkedBlogPost
          key={b.post.id}
          imgUrl={b.post.imgUrl}
          authorImgUrl={b.post.authorImgUrl}  
            authorName={b.post.author.name || "Anonymous"}
            title={b.post.title}
            content={b.post.content}
            tags={!b.post.tags ? ["notags"] : b.post.tags}
            publishDate={b.post.publishDate ? b.post.publishDate : "no trace"}
            likes={b.post.likes}
            id={Number(b.post.id)}
          />
        ))}
      </div>
    </div>
  </div>
);
}
