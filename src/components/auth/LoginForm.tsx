"use client"

import { useActionState, startTransition } from "react"
import { authenticate } from "@/actions/auth"
import { Loader2, KeyRound, User as UserIcon, ShieldAlert } from "lucide-react"

function LoginButton({ pending }: { pending: boolean }) {
    return (
        <button
            type="submit"
            className="w-full h-12 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-98 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black disabled:opacity-70 disabled:pointer-events-none"
            disabled={pending}
        >
            {pending ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Masuk ke Sistem...</span>
                </>
            ) : (
                "Masuk"
            )}
        </button>
    )
}

export default function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        startTransition(() => {
            formAction(formData)
        })
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden select-none bg-slate-900">
            {/* Ambient Background iOS Blur Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/30 blur-[120px] animate-float pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/30 blur-[120px] animate-float-reverse pointer-events-none" />
            <div className="absolute top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-indigo-600/20 blur-[100px] animate-float pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in relative z-10">
                {/* Frosted Glass Login Card */}
                <div className="glass-card backdrop-blur-xl bg-white/10 dark:bg-black/35 border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
                    {/* Visual indicator bar at the top */}
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
                    
                    {/* App Branding */}
                    <div className="h-16 w-16 rounded-2xl bg-white/15 dark:bg-white/5 border border-white/20 flex items-center justify-center shadow-inner mb-5 relative overflow-hidden animate-float">
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-blue-200">
                            HK
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-white text-center">
                        SMK HKTI 2
                    </h1>
                    <p className="text-sm text-blue-200/60 mt-1 mb-8 text-center font-medium">
                        Sistem Rekap Keterlambatan Siswa
                    </p>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                        {/* Username Field */}
                        <div className="flex flex-col gap-2">
                            <label 
                                htmlFor="username" 
                                className="text-blue-100/70 text-xs font-semibold uppercase tracking-wider pl-1"
                            >
                                Username
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-blue-100/40 pointer-events-none" />
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Masukkan username"
                                    required
                                    autoComplete="username"
                                    className="w-full h-12 pl-12 pr-4 bg-white/5 hover:bg-white/8 dark:bg-black/20 dark:hover:bg-black/30 border border-white/10 dark:border-white/5 focus:border-blue-500/50 dark:focus:border-blue-500/50 text-white placeholder:text-blue-200/30 transition-all duration-300 rounded-2xl outline-none focus:ring-1 focus:ring-blue-500/30 font-medium"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <label 
                                htmlFor="password" 
                                className="text-blue-100/70 text-xs font-semibold uppercase tracking-wider pl-1"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-blue-100/40 pointer-events-none" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full h-12 pl-12 pr-4 bg-white/5 hover:bg-white/8 dark:bg-black/20 dark:hover:bg-black/30 border border-white/10 dark:border-white/5 focus:border-blue-500/50 dark:focus:border-blue-500/50 text-white placeholder:text-blue-200/30 transition-all duration-300 rounded-2xl outline-none focus:ring-1 focus:ring-blue-500/30 font-medium"
                                />
                            </div>
                        </div>

                        {/* Error Message banner */}
                        {errorMessage && (
                            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 animate-shake">
                                <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
                                <p className="text-xs font-medium leading-normal">{errorMessage}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-2">
                            <LoginButton pending={isPending} />
                        </div>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-[11px] text-blue-200/40 font-medium uppercase tracking-wider">
                            SMK HKTI 2 Purwareja Klampok &copy; 2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
