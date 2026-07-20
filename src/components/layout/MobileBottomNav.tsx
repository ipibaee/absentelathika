"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/actions/auth"
import { 
    LayoutDashboard, 
    UserCheck, 
    Menu, 
    LogOut,
    User,
    X,
    CalendarDays
} from "lucide-react"

export function MobileBottomNav({ user }: { user: any }) {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Dynamic Navigation Items based on Role
    const navItems = [
        { label: "Catat Telat", icon: UserCheck, href: "/record" }
    ]

    if (user?.role === "ADMIN") {
        navItems.push({ label: "Dasbor", icon: LayoutDashboard, href: "/dashboard" })
    }

    return (
        <>
            {/* Fixed Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 h-16 rounded-2xl glass-card border border-white/20 dark:border-white/10 shadow-2xl z-40 flex items-center justify-around px-2 py-1 select-none">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 dark:text-slate-500 transition-all duration-300 relative",
                                isActive && "text-blue-600 dark:text-blue-400 font-semibold"
                            )}
                        >
                            <item.icon className={cn("h-5.5 w-5.5 transition-transform duration-300", isActive && "scale-110")} />
                            <span className="text-[10px] mt-1 tracking-wide">{item.label}</span>
                            {isActive && (
                                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                            )}
                        </Link>
                    )
                })}
                
                {/* Lainnya Toggle Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 dark:text-slate-500 transition-all duration-300 relative cursor-pointer outline-none",
                        isMenuOpen && "text-blue-600 dark:text-blue-400 font-semibold"
                    )}
                >
                    <Menu className={cn("h-5.5 w-5.5 transition-transform duration-300", isMenuOpen && "rotate-90")} />
                    <span className="text-[10px] mt-1 tracking-wide">Menu</span>
                </button>
            </div>

            {/* Slide-up Liquid Glass Drawer for 'Lainnya' */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs z-50 animate-fade-in flex items-end justify-center">
                    {/* Backdrop Click to Close */}
                    <div className="absolute inset-0" onClick={() => setIsMenuOpen(false)} />

                    {/* Bottom Drawer Card */}
                    <div className="relative w-full max-w-lg bg-white/90 dark:bg-[#0c1224]/95 backdrop-blur-2xl border-t border-x border-white/20 dark:border-white/10 rounded-t-3xl shadow-2xl p-6 pb-10 z-10 animate-slide-up flex flex-col gap-4">
                        {/* Drawer Handle bar */}
                        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 shrink-0" />

                        {/* Title & Close */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Informasi Pengguna</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Masuk sebagai {user?.username}</p>
                            </div>
                            <button 
                                onClick={() => setIsMenuOpen(false)}
                                className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
                            >
                                <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* User Profile Card inside sheet */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                            <div className="h-12 w-12 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center border border-blue-600/10 dark:border-blue-400/10">
                                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 capitalize">{user?.username}</h4>
                                <span className="inline-block px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-semibold tracking-wide bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/30">
                                    {user?.role === "ADMIN" ? "Administrator" : "Guru Piket"}
                                </span>
                            </div>
                        </div>

                        {/* Manage Users Option (Admin only) */}
                        {user?.role === "ADMIN" && (
                            <Link
                                href="/dashboard/users"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold transition active:scale-98 cursor-pointer outline-none"
                            >
                                <User className="h-4.5 w-4.5" />
                                <span>Manajemen User</span>
                            </Link>
                        )}

                        {/* Logout Option */}
                        <button
                            onClick={() => {
                                setIsMenuOpen(false)
                                logout()
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3.5 mt-2 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold transition active:scale-98 cursor-pointer outline-none"
                        >
                            <LogOut className="h-4.5 w-4.5" />
                            <span>Keluar dari Aplikasi</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
