import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.name as string | undefined) ?? user?.email?.split("@")[0] ?? "User";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-tfl-navy text-white flex flex-col">
      <header className="border-b border-white/5 bg-tfl-navy/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40">
              <span className="font-display text-xl">T</span>
            </div>
            <div>
              <div className="font-display text-xl tracking-wider leading-none">
                TFL <span className="text-red-500">MANAGER</span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                Table Football League
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <form action={signOut}>
              <button type="submit" className="hidden sm:block text-xs text-slate-400 hover:text-white transition-colors">
                Sign out
              </button>
            </form>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-sm font-semibold ring-2 ring-white/10 select-none">
              {initials}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
