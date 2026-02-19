"use client";

import { Fragment, useRef, ElementRef } from "react";
import { Loader2, ServerCrash, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import ChatItem from "./chat-item";
import ChatWelcome from "./chat-welcome";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/types";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

interface ChatMessagesProps {
  roomId: string;
  currentUserId: string;
  itemName: string;
  /** Optional: map of userId → display name for other participants */
  memberNames?: Record<string, string>;
}

const ChatMessages = ({
  roomId,
  currentUserId,
  itemName,
  memberNames = {},
}: ChatMessagesProps) => {
  // Query key mirrors strikes-community convention: `chat:${chatId}`
  const queryKey = `chat:${roomId}`;

  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);

  // Paginated fetch (replaces strikes-community useChatQuery with REST API)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({ queryKey, roomId });

  // Real-time subscription (replaces strikes-community useChatSocket with socket.io)
  useChatRealtime({ queryKey, roomId });

  // Auto-scroll + load-more on scroll-to-top (direct port from strikes-community)
  useChatScroll({
    chatRef: chatRef as React.RefObject<HTMLDivElement>,
    bottomRef: bottomRef as React.RefObject<HTMLDivElement>,
    count: data?.pages?.[0]?.items.length ?? 0,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
  });

  if (status === "pending") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Loading messages...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <ServerCrash className="h-6 w-6 text-destructive" />
        <p className="mt-2 text-sm text-muted-foreground">
          Failed to load messages
        </p>
      </div>
    );
  }

  return (
    <div
      ref={chatRef}
      className="flex flex-1 flex-col overflow-y-auto py-4"
    >
      <div className="flex-1">
        {/* Show welcome message when all history is loaded */}
        {!hasNextPage && <ChatWelcome itemName={itemName} />}

        {/* Load older messages button — mirrors strikes-community pattern */}
        {hasNextPage && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="ghost"
              size="sm"
              className="gap-2 text-xs"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Load previous messages
                </>
              )}
            </Button>
          </div>
        )}

        {/* Messages rendered newest-first within each page, pages in reverse order
            so the scroll container naturally starts at the bottom — identical to
            the strikes-community flex-col-reverse approach */}
        <div className="flex flex-col-reverse mt-auto">
          {data?.pages?.map((group, i) => (
            <Fragment key={i}>
              {group.items.map((message: ChatMessage) => (
                <ChatItem
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  senderName={
                    message.senderId === currentUserId
                      ? "You"
                      : memberNames[message.senderId] || "Peer"
                  }
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Scroll anchor — mirrors strikes-community bottomRef div */}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
