export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <span className="font-display text-xl text-white tracking-wide">TFL</span>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
