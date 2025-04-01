import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { MessageCircle } from "lucide-react";
import { prisma } from "~/.server/db";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Find Collaborators - BlogStack" },
    {
      name: "description",
      content:
        "Connect with other writers on BlogStack. Find collaborators for your blog posts and create amazing content together.",
    },
    {
      property: "og:title",
      content: "Find Collaborators - BlogStack",
    },
    {
      property: "og:description",
      content:
        "Connect with other writers on BlogStack. Find collaborators for your blog posts and create amazing content together.",
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/logo.png" },
    { property: "og:image:width", content: "256" },
    { property: "og:image:height", content: "256" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "Find Collaborators - BlogStack",
    },
    {
      name: "twitter:description",
      content:
        "Connect with other writers on BlogStack. Find collaborators for your blog posts and create amazing content together.",
    },
    { name: "twitter:image", content: "/logo.png" },
  ];
};

export const loader: LoaderFunction = async (args) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        openToCollab: true,
      },
    });
    return {
      status: "success",
      body: users,
    };
  } catch (e) {
    console.error(e);
  }
  return "";
};
const Collab = () => {
  interface User {
    id: number;
    identifier: string;
    email: string;
    name: string | null;
    password: string | null;
    pfpUrl: string | null;
    fname: string | null;
    lname: string | null;
    openToCollab: boolean;
  }
  const { body } = useLoaderData<typeof loader>();
  const Users: User[] = body;
  return (
    <div className="p-10">
      <div>{"Available Collaborators "}</div>
      {Users.map((user) => (
        <div className="flex gap-2 p-5 " key={user.id}>
          <div className=" bg-slate-200 w-[300px] flex justify-between p-5 rounded-lg">
            <div className="mt-2">{user.fname}</div>
            <img
              src={user.pfpUrl ?? ""}
              alt=""
              className="size-10 rounded-full"
            />
          </div>
          <div className="p-5">
            <MessageCircle className=" cursor-pointer" />
          </div>
        </div>
      ))}
    </div>
  );
};
export default Collab;
