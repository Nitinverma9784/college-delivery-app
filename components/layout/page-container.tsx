import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  bottomNav?: boolean;
}

export function PageContainer({
  children,
  className,
  bottomNav = true,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto min-h-screen max-w-md bg-background",
        bottomNav && "pb-20",
        className
      )}
    >
      {children}
    </main>
  );
}
