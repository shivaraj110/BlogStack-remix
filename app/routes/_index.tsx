import { SignedIn, SignedOut } from "@clerk/remix";
import LandingComp from "~/components/LandingComp";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { createClerkClient } from "@clerk/remix/api.server";
import { prisma } from "~/.server/db";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "BlogStack - Your Personal Blogging Platform" },
    {
      name: "description",
      content:
        "Create, share, and discover amazing blog posts with BlogStack. Join our community of writers and readers.",
    },
    {
      property: "og:title",
      content: "BlogStack - Your Personal Blogging Platform",
    },
    {
      property: "og:description",
      content:
        "Create, share, and discover amazing blog posts with BlogStack. Join our community of writers and readers.",
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/logo.png" },
    { property: "og:image:width", content: "256" },
    { property: "og:image:height", content: "256" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "BlogStack - Your Personal Blogging Platform",
    },
    {
      name: "twitter:description",
      content:
        "Create, share, and discover amazing blog posts with BlogStack. Join our community of writers and readers.",
    },
    { name: "twitter:image", content: "/logo.png" },
  ];
};

export const loader: LoaderFunction = async (args) => {
  try {
    const { userId } = await getAuth(args);
    if (userId) {
      const user = await createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      }).users.getUser(userId);
      if (user) {
        const User = await prisma.user.findFirst({
          where: {
            identifier: user?.id.toString(),
          },
        });

        if (User?.id) {
          await prisma.user.update({
            where: {
              identifier: user.id,
            },
            data: {
              email: user.emailAddresses[0].emailAddress.toString(),
            },
          });
        }

        if (!User?.id && user) {
          await prisma.user
            .create({
              data: {
                identifier: user.id,
                email: user.emailAddresses[0].emailAddress.toString(),
                name: user.fullName,
                pfpUrl: user.imageUrl,
                fname: user.firstName,
                lname: user.lastName,
              },
            })
            .finally(() => {
              redirect("/dashboard");
            });
        }
        //ensuring email in database

        return redirect("/dashboard");
      }
    }
  } catch (e) {
    console.error("error :(  " + e);
  }
  return redirect("/blog");
};
function Landing() {
  return (
    <div>
      <SignedOut>
        <LandingComp />
      </SignedOut>
      <SignedIn></SignedIn>
    </div>
  );
}
export default Landing;
