import { SignedIn, SignedOut } from "@clerk/remix";
import LandingComp from "~/components/LandingComp";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { createClerkClient } from "@clerk/remix/api.server";
import { prisma } from "~/.server/db";

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
        if (!User?.email && user) {
          await prisma.user
            .create({
              data: {
                identifier: user.id,
                email: user.emailAddresses[0].toString(),
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
