import { getAuth } from "@clerk/remix/ssr.server"
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"
import { Link, useLoaderData, useSearchParams } from "@remix-run/react"
import { getBookmarks } from "~/.server/bookmark"
import { prisma } from "~/.server/db"
import BlogPost from "~/components/Blog"
export const loader:LoaderFunction = async(args:LoaderFunctionArgs) => {
    const {userId} = await getAuth(args)
    const tag = args.params["tag"]
  try{
    const blogs = await prisma.post.findMany({
        where : {
            tags : {
                has : tag
            }
        },
      select : {
        id : true,
        tags : true,
        title : true,
        content : true,
        likes : true,
        authorId : true,
        imgUrl:true,
        publishDate : true,
        authorImgUrl:true,
        author : {
          select : {
            name : true
          }
        }
      }
    })
    const bookmarks = await getBookmarks(userId ?? "")
    let bookMarkPostIds:number[] = [] 
    bookmarks?.map((b)=>[
      bookMarkPostIds.push(b.postId)
    ])
    return {
      status : "success",
      body : {
        tag,
        blogs,
        bookMarkPostIds
      }
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
  const {body}= useLoaderData<typeof loader>()
  const blogs:BlogData[] = body.blogs
  const bookmarkIds:number[] = body.bookMarkPostIds
if( !blogs[0] ){
  return <div className="p-5 flex">
    No blogs added yet. Be the first one to <Link to={"/blog/write"} className="underline px-1 cursor-pointer">add blogs</Link>!
  </div>
}

return (
  <div className="p-1 max-w-7xl mx-auto">
    <div className="flex flex-col">
      <div className="mt-6">
<div className="mt-4 flex gap-1">
{"Showing results for"} <p className="text-blue-600"> {"#" + body.tag} </p>
</div>
        {blogs.map((b) => (
          <BlogPost
authorId={b.authorId}
          key={b.id}
          imgUrl={b.imgUrl ?? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxrqLPeOlGY5Ezx_xkUTLkTmPSsEVSShRMJg&s"}
          authorImgUrl={b.authorImgUrl}
            authorName={b.author.name || "Anonymous"}
            title={b.title}
            content={b.content}
            tags={!b.tags ? ["notags"] : b.tags}
            publishDate={b.publishDate ? b.publishDate : "no trace"}
            likes={b.likes}
            id={Number(b.id)}
            bookmarks={bookmarkIds}
          />
        ))}
      </div>
    </div>
  </div>
);
}
