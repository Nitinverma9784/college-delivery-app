
import { ArrowLeft, CheckCircle2, Video } from "lucide-react";
import Link from "next/link";
import { DeliveryProgressPill } from "@/components/common/delivery-progress";
import type { DeliveryStatus } from "@/lib/types";

interface ChatHeaderProps {
  itemName: string;
  requestId?: string;
  status?: DeliveryStatus;
  otherUserName?: string;
  otherUserAvatar?: string;
  onStartCall?: () => void;
  callDisabled?: boolean;
  backHref?: string;
}

const ChatHeader = ({
  itemName,
  requestId,
  status,
  otherUserName,
  otherUserAvatar,
  onStartCall,
  callDisabled,
  backHref = "/",
}: ChatHeaderProps) => {
  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
      {/* Back navigation */}
      <Link
        href={backHref}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {/* Avatar — mirrors strikes-community UserAvatar position */}
      {otherUserAvatar ? (
        <img
          src={otherUserAvatar}
          alt={otherUserName || "Peer"}
          className="h-9 w-9 rounded-full object-cover border border-border"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary uppercase">
          {otherUserName?.charAt(0) || "?"}
        </div>
      )}

      {/* Title + subtitle */}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm font-semibold text-foreground">
          {otherUserName || itemName}
        </p>
        {requestId && (
          <p className="truncate text-xs text-muted-foreground">
            Request #{requestId.slice(0, 8)}
          </p>
        )}
      </div>

      {/* Status pill */}
      {status && <DeliveryProgressPill status={status} />}

      {/* Video call button — mirrors strikes-community ChatVideoButton */}
      {onStartCall && (
        <button
          onClick={onStartCall}
          disabled={callDisabled}
          aria-label="Start video call"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors"
        >
          <Video className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
