import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { prisma } from "~/.server/db";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const targetUserId = args.params.userId;

  if (!userId || !targetUserId) {
    return redirect("/dashboard/messages");
  }

  // Check if the user exists
  const targetUser = await prisma.user.findUnique({
    where: {
      identifier: targetUserId,
    },
    select: {
      id: true,
      identifier: true,
      name: true,
    },
  });

  if (!targetUser) {
    return json({
      error: "User not found",
      targetUserId,
      conversationId: null,
    });
  }

  // Check if conversation already exists
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { users: { some: { identifier: userId } } },
        { users: { some: { identifier: targetUserId } } },
      ],
    },
  });

  if (existingConversation) {
    return json({
      conversationId: existingConversation.id,
      targetUserId,
      targetUserName: targetUser.name,
    });
  }

  // Create a new conversation
  try {
    const newConversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [{ identifier: userId }, { identifier: targetUserId }],
        },
      },
    });

    return json({
      conversationId: newConversation.id,
      targetUserId,
      targetUserName: targetUser.name,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return json({
      error: "Failed to create conversation",
      targetUserId,
      conversationId: null,
    });
  }
};

export default function NewConversation() {
  const { conversationId, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    if (conversationId) {
      // Navigate to the conversation
      navigate(`/dashboard/messages/${conversationId}`);
    }
  }, [conversationId, navigate]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white/70">
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p>{error}</p>
          <button
            onClick={() => navigate("/dashboard/messages")}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-pulse">
        <div className="h-10 w-40 bg-white/10 rounded-full mb-4"></div>
        <div className="h-4 w-60 bg-white/5 rounded-full"></div>
      </div>
    </div>
  );
}
