import { createClerkClient } from "@clerk/remix/api.server";
import { getAuth } from "@clerk/remix/ssr.server";
import { ActionFunction, ActionFunctionArgs } from "@remix-run/node";
import { Form, redirect } from "@remix-run/react";
import { useState } from "react";
import { pushBlogs } from "~/.server/pushBlogs";
import { UploadDropzone } from "~/utils/uploadthing";

export const action: ActionFunction = async (args: ActionFunctionArgs) => {
  const formData = await args.request.formData();
  const title = formData.get("title")?.toString() ?? "";
  const content = formData.get("content")?.toString() ?? "";
  const tags = formData.get("tags")?.toString().split(",") ?? [""];
  const imgUrl = formData.get("imgUrl")?.toString() ?? "";
  const publishDate = new Date().toDateString();

  try {
    const { userId } = await getAuth(args);
    if (!userId) {
      return redirect("/");
    }
    const user = await createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    }).users.getUser(userId);
    const authorImgUrl = user.imageUrl;
    const authorId = userId;
    await pushBlogs({
      title,
      content,
      tags,
      imgUrl,
      authorId,
      publishDate,
      authorImgUrl,
    });
    alert("added the blog!");
    return {
      status: "success",
    };
  } catch (e) {
    console.error(e);
    return {
      status: "failed",
    };
  }
};

const Solo = () => {
  const [url, setUrl] = useState("");
  return (
    <div className="p-20">
      <div className="bg-white/25 shadow-xl text-slate-900 p-10 rounded-xl backdrop-brightness-100 backdrop-blur-lg">
        <div className="grid grid-cols-2">
          <Form
            method="POST"
            className="flex col-span-1 p-20 flex-col space-y-10 gap-2 "
          >
            <input
              type="text"
              name="title"
              placeholder="Title"
              className=" w-[350px]  bg-transparent border-b border-gray-950 outline-none  text-slate-900 placeholder:text-slate-700 "
            />
            <textarea
              name="content"
              className="border-b border-gray-950 outline-none bg-transparent text-slate-900 placeholder:text-slate-700 w-[350px]"
              placeholder="Content"
            ></textarea>
            <input
              type="text"
              name="tags"
              placeholder="Tags (seperated by comma)"
              className=" w-[350px]  bg-transparent border-b border-gray-950 outline-none  text-slate-900 placeholder:text-slate-700 "
            />
            <input
              type="submit"
              className="self-start p-2 border cursor-pointer mt-2 bg-transparent backdrop-blur-sm backdrop-brightness-105 rounded-lg"
            />
            <input type="hidden" name="imgUrl" value={url} />
          </Form>
          <div className="flex flex-col justify-center">
            <UploadDropzone
              className="bg-gray-400/20 ut-button:cursor-pointer backdrop-blur-sm "
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                // Do something with the response
                console.log("Files: ", res[0].url);
                setUrl(res[0].url);
                alert("Upload Completed");
              }}
              onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
              }}
              onUploadBegin={(name) => {
                // Do something once upload begins
                console.log("Uploading: ", name);
              }}
              onChange={(acceptedFiles) => {
                // Do something with the accepted files
                console.log("Accepted files: ", acceptedFiles);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Solo;
