"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/actions/auth"
import { 
    LayoutDashboard, 
    UserCheck, 
    LogOut,
    User,
    School
} from "lucide-react"

export function Sidebar({ user }: { user: any }) {
    const pathname = usePathname()

    const navItems = [
        { label: "Catat Keterlambatan", icon: UserCheck, href: "/record" }
    ]

    if (user?.role === "ADMIN") {
        navItems.unshift({ label: "Dasbor Rekap", icon: LayoutDashboard, href: "/dashboard" })
        navItems.push({ label: "Manajemen User", icon: User, href: "/dashboard/users" })
    }

    return (
        <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 border-r border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-2xl z-30 select-none p-6">
            {/* School Header */}
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center border border-blue-600/20 dark:border-blue-400/25">
                    <School className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                        SMK HKTI 2
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Purwareja Klampok
                    </p>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 h-12 rounded-2xl text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 hover:bg-slate-100/50 dark:hover:bg-white/5 active:scale-98",
                                isActive && "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-500 shadow-md shadow-blue-500/10"
                            )}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile Card & Sign out */}
            <div className="flex flex-col gap-4 mt-auto">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <div className="h-9 w-9 rounded-lg bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center border border-blue-600/10 dark:border-blue-400/10 shrink-0">
                        <User className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate capitalize">
                            {user?.username}
                        </h4>
                        <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 block mt-0.5">
                            {user?.role === "ADMIN" ? "Administrator" : "Guru Piket"}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => logout()}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold transition active:scale-98 cursor-pointer outline-none"
                >
                    <LogOut className="h-4.5 w-4.5" />
                    <span>Keluar Aplikasi</span>
                </button>
            </div>
        </aside>
    )
}
