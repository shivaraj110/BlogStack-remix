import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { prisma } from "~/.server/db";
import { BlogSection } from "~/components/BlogSection";
import { CollabCard } from "~/components/ColabCard";
import { ProfileCard } from "~/components/ProfileCard";
import Writeblog from "~/components/Writeblog";
export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  try {
    const currUser = await prisma.user.findFirst({
      where: {
        identifier: userId ?? "",
      },
      select: {
        posts: true,
        bookmarks: true,
        joinedOn: true,
      },
    });
    return {
      status: "success",
      body: {
        posts: currUser?.posts?.length,
        bookmarks: currUser?.bookmarks?.length,
        joinedOn: currUser?.joinedOn,
      },
    };
  } catch {
    return {
      status: "error",
    };
  }
};
export default function DashboardPage() {
  const { body } = useLoaderData<typeof loader>();
  const posts = body?.posts ?? 0;
  const Bookmarks = body?.bookmarks ?? 0;
  const dateJoined = format(
    body?.joinedOn ? new Date(body.joinedOn) : new Date(),
    "do MMM yyyy"
  );
  return (
    <div className="grid md:grid-cols-[1fr_500px] max-w-7xl mx-auto sm:p-10 p-5 gap-6">
      <div className="col-span-0.5">
        <ProfileCard dateJoined={dateJoined} />
        <Writeblog />
      </div>
      <div className="space-y-6">
        <BlogSection blogs={posts} bookmarks={Bookmarks} />
        <CollabCard />
      </div>
    </div>
  );
}
