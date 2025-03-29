import { MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";

export interface ToastProps {
  message: string;
  conversationId?: number;
  senderName?: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  conversationId,
  senderName,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for fadeout animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClick = () => {
    if (conversationId) {
      navigate(`/dashboard/messages/${conversationId}`);
    }
    onClose();
  };

  return (
    <div
      className={`fixed bottom-4 right-4 bg-gray-800 text-white rounded-lg shadow-lg p-4 flex items-start space-x-3 max-w-xs z-50 transition-all duration-300 transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      role="alert"
    >
      <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
        <MessageSquare className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        {senderName && (
          <p className="font-medium text-blue-400">{senderName}</p>
        )}
        <p className="text-sm text-white/90 line-clamp-2">{message}</p>
        <button
          onClick={handleClick}
          className="text-xs text-blue-400 hover:text-blue-300 mt-1"
        >
          {conversationId ? "Open conversation" : "Dismiss"}
        </button>
      </div>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white focus:outline-none flex-shrink-0"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
