/**
 * Dispatches a new message notification
 */
export function notifyNewMessage(
  message: string,
  conversationId?: number,
  senderName?: string
) {
  // Create and dispatch custom event
  const event = new CustomEvent("new-message", {
    detail: {
      message,
      conversationId,
      senderName,
    },
  });

  window.dispatchEvent(event);
}
