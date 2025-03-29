import { useEffect, useState } from "react";
import Toast, { ToastProps } from "./Toast";

export interface ToastNotification extends Omit<ToastProps, "onClose"> {
  id: string;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Setup global event listener for new message notifications
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const { message, conversationId, senderName } = event.detail;

      // Add new toast with unique ID
      const newToast: ToastNotification = {
        id: crypto.randomUUID(),
        message,
        conversationId,
        senderName,
      };

      setToasts((prev) => [...prev, newToast]);
    };

    // Add event listener for custom event
    window.addEventListener(
      "new-message" as any,
      handleNewMessage as EventListener
    );

    return () => {
      window.removeEventListener(
        "new-message" as any,
        handleNewMessage as EventListener
      );
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            bottom: `${(toasts.length - 1 - index) * 4 + 4}rem`,
            zIndex: 50 - index,
          }}
          className="fixed right-4 transition-all duration-300"
        >
          <Toast
            message={toast.message}
            conversationId={toast.conversationId}
            senderName={toast.senderName}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
