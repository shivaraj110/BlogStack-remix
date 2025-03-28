import { MessageSquareText } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-white/50">
      <MessageSquareText className="h-16 w-16 mb-4 opacity-30" />
      <h2 className="text-xl font-medium mb-2">Your Messages</h2>
      <p className="text-center max-w-md text-white/40">
        Select a conversation from the sidebar or start a new one by searching
        for users.
      </p>
    </div>
  );
}
