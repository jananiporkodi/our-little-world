import SidebarNav from "./SidebarNav";
import BottomNav from "./BottomNav";
import FloatingSparkles from "./FloatingSparkles";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <FloatingSparkles />
      <SidebarNav />
      <main className="flex-1 min-w-0 px-4 pt-6 pb-24 md:px-10 md:py-8 md:pb-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
