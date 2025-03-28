import { getAuth } from "@clerk/remix/ssr.server";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/.server/db";

export async function action(args: ActionFunctionArgs) {
  const { userId } = await getAuth(args);

  // Only allow authenticated users to sync
  if (!userId) {
    return json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await args.request.formData();
    const action = formData.get("action") as string;

    if (action !== "sync-user") {
      return json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    // Get user data from form
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const imageUrl = formData.get("imageUrl") as string;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { identifier: userId },
    });

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { identifier: userId },
        data: {
          email: email || existingUser.email,
          name: name || existingUser.name,
          fname: firstName || existingUser.fname,
          lname: lastName || existingUser.lname,
          pfpUrl: imageUrl || existingUser.pfpUrl,
        },
      });

      return json({ success: true, message: "User updated" });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          identifier: userId,
          email: email,
          name: name,
          fname: firstName || "",
          lname: lastName || "",
          pfpUrl: imageUrl || null,
        },
      });

      return json({ success: true, message: "User created" });
    }
  } catch (error) {
    console.error("Error syncing user:", error);
    return json(
      { success: false, message: "Failed to sync user", error: String(error) },
      { status: 500 }
    );
  }
}
