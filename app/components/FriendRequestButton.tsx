import { useState, useEffect, ReactNode } from "react";
import { UserPlus, UserMinus, User, Loader2, Check, X } from "lucide-react";
import { useFetcher } from "@remix-run/react";

export type FriendRequestButtonProps = {
  targetUserId: string;
  currentUserId: string;
  initialStatus?: "none" | "pending-sent" | "pending-received" | "friends";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  // Custom class props
  customClass?: string;
  customRejectClass?: string;
  // Custom icon props
  customIcon?: ReactNode;
  customRejectIcon?: ReactNode;
  className?: string;
};

export default function FriendRequestButton({
  targetUserId,
  currentUserId,
  initialStatus = "none",
  size = "md",
  showText = true,
  customClass,
  customRejectClass,
  customIcon,
  customRejectIcon,
  className,
}: FriendRequestButtonProps) {
  const [status, setStatus] = useState<
    "none" | "pending-sent" | "pending-received" | "friends"
  >(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const fetcher = useFetcher();

  // Icon sizes based on the size prop
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // Button sizes based on the size prop
  const buttonSizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  // Update status when fetcher completes
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setIsLoading(false);

      if (
        fetcher.data &&
        typeof fetcher.data === "object" &&
        "status" in fetcher.data &&
        fetcher.data.status === "success"
      ) {
        // Check if we have form data to determine the action
        const formDataResponse =
          "formData" in fetcher.data ? fetcher.data.formData : null;

        if (formDataResponse) {
          try {
            const formData = new FormData(formDataResponse as any);
            const action = formData.get("action")?.toString();

            if (action === "send-request") {
              setStatus("pending-sent");
            } else if (action === "accept-request") {
              setStatus("friends");
            } else if (
              action === "reject-request" ||
              action === "cancel-request"
            ) {
              setStatus("none");
            } else if (action === "remove-friend") {
              setStatus("none");
            }
          } catch (error) {
            console.error("Error processing form data:", error);
          }
        }
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleAction = (action: string) => {
    setIsLoading(true);
    fetcher.submit(
      { action, targetUserId },
      { method: "POST", action: "/api/friends" }
    );
  };

  // Render different buttons based on the friendship status
  const renderButton = () => {
    switch (status) {
      case "none":
        return (
          <button
            name="friend-button"
            type="submit"
            className={
              customClass ||
              `flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors ${
                buttonSizes[size]
              } ${className || ""}`
            }
            disabled={isLoading}
            onClick={() => handleAction("send-request")}
          >
            {isLoading ? (
              <Loader2 className={`${iconSizes[size]} animate-spin`} />
            ) : (
              customIcon || <UserPlus className={iconSizes[size]} />
            )}
            {showText && <span>Add Friend</span>}
          </button>
        );

      case "pending-sent":
        return (
          <button
            name="friend-button"
            type="submit"
            className={
              customClass ||
              `flex items-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors ${
                buttonSizes[size]
              } ${className || ""}`
            }
            disabled={isLoading}
            onClick={() => handleAction("cancel-request")}
          >
            {isLoading ? (
              <Loader2 className={`${iconSizes[size]} animate-spin`} />
            ) : (
              customIcon || <UserMinus className={iconSizes[size]} />
            )}
            {showText && <span>Cancel Request</span>}
          </button>
        );

      case "pending-received":
        return (
          <div className="flex items-center space-x-2">
            <button
              name="friend-button"
              type="submit"
              className={
                customClass ||
                `flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors ${
                  buttonSizes[size]
                } ${className || ""}`
              }
              disabled={isLoading}
              onClick={() => handleAction("accept-request")}
            >
              {isLoading ? (
                <Loader2 className={`${iconSizes[size]} animate-spin`} />
              ) : (
                customIcon || <Check className={iconSizes[size]} />
              )}
              {showText && <span>Accept</span>}
            </button>
            <button
              name="friend-button"
              type="submit"
              className={
                customRejectClass ||
                `flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors ${
                  buttonSizes[size]
                } ${className || ""}`
              }
              disabled={isLoading}
              onClick={() => handleAction("reject-request")}
            >
              {isLoading ? (
                <Loader2 className={`${iconSizes[size]} animate-spin`} />
              ) : (
                customRejectIcon || <X className={iconSizes[size]} />
              )}
              {showText && <span>Reject</span>}
            </button>
          </div>
        );

      case "friends":
        return (
          <button
            name="friend-button"
            type="submit"
            className={
              customClass ||
              `flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors ${
                buttonSizes[size]
              } ${className || ""}`
            }
            disabled={isLoading}
            onClick={() => handleAction("remove-friend")}
          >
            {isLoading ? (
              <Loader2 className={`${iconSizes[size]} animate-spin`} />
            ) : (
              customIcon || <UserMinus className={iconSizes[size]} />
            )}
            {showText && <span>Remove Friend</span>}
          </button>
        );
    }
  };

  return renderButton();
}
