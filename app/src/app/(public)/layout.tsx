export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="border-b border-white/10 px-4 py-3">
        <span className="font-display text-xl text-white tracking-wide">TFL</span>
      </header>
      <main>{children}</main>
    </div>
  );
}
