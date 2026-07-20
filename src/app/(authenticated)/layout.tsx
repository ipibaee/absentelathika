import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Safety fallback: if somehow middleware lets request through, redirect to login
    if (!session || !session.user) {
        redirect("/login")
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b19] transition-colors duration-300">
            {/* Desktop Sidebar */}
            <Sidebar user={session.user} />

            {/* Mobile Bottom Nav */}
            <MobileBottomNav user={session.user} />

            {/* Main Content Area */}
            <main className="md:pl-72 min-h-screen flex flex-col">
                <div className="flex-1 p-4 md:p-10 pb-28 md:pb-10 max-w-7xl w-full mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    )
}
