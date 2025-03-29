import { MessageSquareText } from "lucide-react";
import { notifyNewMessage } from "~/utils/notifications";

export default function MessagesIndexPage() {
  // Function to test the notification system
  const testNotification = () => {
    notifyNewMessage(
      "This is a test message notification!",
      1, // Example conversation ID
      "Test User"
    );
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-white/50">
      <MessageSquareText className="h-16 w-16 mb-4 opacity-30" />
      <h2 className="text-xl font-medium mb-2">Your Messages</h2>
      <p className="text-center max-w-md text-white/40">
        Select a conversation from the sidebar or start a new one by searching
        for users.
      </p>

      {/* Test button - remove this in production */}
      <button
        onClick={testNotification}
        className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        Test Notification
      </button>
    </div>
  );
}
