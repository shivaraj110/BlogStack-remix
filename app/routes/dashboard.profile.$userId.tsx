import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { UserPlus2 } from "lucide-react";
import { prisma } from "~/.server/db";

// Define types for better type safety
type LoaderData = { 
  status: "success" | "error";
  body?: {
    user: {
      posts: any[];
      pfpUrl: string | null;
      name: string | null;
    } | null;
  };
  error?: string;
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const userId = Number(params["userId"]);

    if (isNaN(userId)) {
      return json<LoaderData>({
        status: "error",
        error: "Invalid user ID",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        posts: true,
        pfpUrl: true,
        name: true,
      },
    });

    if (!user) {
      return json<LoaderData>({
        status: "error",
        error: "User not found",
      });
    }

    return json<LoaderData>({
      status: "success",
      body: { user },
    });
  } catch (error) {
    console.error("Profile loader error:", error);
    return json<LoaderData>({
      status: "error",
      error: "Failed to load user profile",
    });
  }
};

const Profile = () => {
  const data = useLoaderData<typeof loader>();

  if (data.status === "error") {
    return (
      <div className="text-center p-10">
        <p className="text-red-500">{data.error ?? "An error occurred"}</p>
      </div>
    );
  }

  const { user } = data.body ?? {};
  const authorName = user?.name ?? "Anonymous";
  const authorImgUrl = user?.pfpUrl;
  const posts = user?.posts ?? [];

  return (
    <div className="text-center bg-white/40 backdrop-blur-sm border rounded-3xl max-w-lg mx-auto p-10 flex flex-col items-center mt-20">
      <div className="relative">
        <img
          src={authorImgUrl ?? "/default-avatar.png"}
          alt={`${authorName}'s profile picture`}
          className="h-32 w-32 rounded-full object-cover"
        />
      </div>

      <div className="p-10 mt-2 flex flex-col w-full">
        <div className="flex gap-2">
          <div className="flex mx-auto items-center">
            <span className="font-semibold text-lg">{authorName}</span>
            <button
              className="group ml-2"
              title="Add connection"
              aria-label="Add connection"
            >
              <UserPlus2 className="text-gray-600 group-hover:text-gray-800 transition-colors" />
            </button>
          </div>
        </div>

        <div className="mt-5 text-gray-600">
          <p>Work details here</p>
        </div>

        <div className="flex justify-around max-w-xs mx-auto mt-5 space-x-2 text-sm">
          <div className="flex flex-col">
            <span className="font-semibold">69</span>
            <span className="text-gray-600">Collabs</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">{posts.length}</span>
            <span className="text-gray-600">Posts</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">69</span>
            <span className="text-gray-600">Connections</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
