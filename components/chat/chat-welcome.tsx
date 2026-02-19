import { MessageCircle } from "lucide-react";

interface ChatWelcomeProps {
  itemName: string;
}

const ChatWelcome = ({ itemName }: ChatWelcomeProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 space-y-2">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <MessageCircle className="h-7 w-7 text-primary" />
      </div>
      <p className="text-center text-base font-semibold text-foreground">
        Start of your chat
      </p>
      <p className="text-center text-sm text-muted-foreground max-w-xs">
        This is the beginning of your conversation about{" "}
        <span className="font-medium text-foreground">{itemName}</span>. Discuss
        price, location, and delivery details here.
      </p>
    </div>
  );
};

export default ChatWelcome;
