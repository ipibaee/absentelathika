"use client"

import { useState, useOptimistic, useTransition, useEffect } from "react"
import { createPortal } from "react-dom"
import { Search, User, AlertCircle, CheckCircle2, Clock, X, Sparkles } from "lucide-react"
import { recordTardiness } from "@/actions/tardiness"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"

interface Student {
    id: string
    nis: string
    name: string
    kelas: string
    jurusan: string
    tardiesCount: number
}

interface RecordClientProps {
    initialStudents: Student[]
    stats: {
        tardiesToday: number
        topClass: string
    }
    currentUser: any
}

// Quick select reasons for easy data entry
const COMMON_REASONS = [
    "Bangun Kesiangan",
    "Ban Bocor / Kendala Motor",
    "Macet Lalu Lintas",
    "Ketinggalan Angkutan",
    "Hujan Lebat",
    "Membantu Orang Tua"
]

export function RecordClient({ initialStudents, stats: initialStats, currentUser }: RecordClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [allStudents, setAllStudents] = useState<Student[]>(initialStudents)
    const [stats, setStats] = useState(initialStats)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [reason, setReason] = useState("")
    const [isPending, startTransition] = useTransition()
    const [isMounted, setIsMounted] = useState(false)

    // Set isMounted to true on client mount
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Optimistic UI logic:
    // Update the students' tardies count immediately upon submitting
    const [optimisticStudents, setOptimisticStudents] = useOptimistic(
        allStudents,
        (state, updatedStudentId: string) => {
            return state.map(student => {
                if (student.id === updatedStudentId) {
                    return { ...student, tardiesCount: student.tardiesCount + 1 }
                }
                return student
            })
        }
    )

    // Filter students locally (O(N) in memory, sub-millisecond lookup)
    const filteredStudents = optimisticStudents.filter(student => {
        const query = searchQuery.toLowerCase()
        return (
            student.name.toLowerCase().includes(query) ||
            student.nis.includes(query) ||
            student.kelas.toLowerCase().includes(query)
        )
    })

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStudent) return

        const studentToRecord = selectedStudent
        const currentReason = reason.trim() || "Tanpa alasan"

        // Close modal sheet instantly for immediate mobile control
        setSelectedStudent(null)
        setReason("")

        // Optimistically update the UI
        startTransition(async () => {
            // Apply optimistic increment
            setOptimisticStudents(studentToRecord.id)
            
            // Show optimistic success toast
            const toastId = toast.success(`Mencatat keterlambatan ${studentToRecord.name}...`, {
                description: `Alasan: ${currentReason}`,
                duration: 4000
            })

            // Call Server Action
            const result = await recordTardiness(studentToRecord.id, currentReason)

            if (result.success) {
                // Permanently update local state with server response data
                setAllStudents(prev => 
                    prev.map(s => {
                        if (s.id === studentToRecord.id) {
                            return { ...s, tardiesCount: s.tardiesCount + 1 }
                        }
                        return s
                    })
                )
                // Increment today lates count locally
                setStats(prev => ({
                    ...prev,
                    tardiesToday: prev.tardiesToday + 1
                }))
                toast.dismiss(toastId)
                toast.success(`Berhasil mencatat keterlambatan ${studentToRecord.name}`, {
                    icon: <CheckCircle2 className="h-5 w-5 text-green-500 animate-bounce" />,
                })
            } else {
                // Rollback automatically (handled by React 19 transition + useOptimistic)
                toast.dismiss(toastId)
                toast.error(`Gagal mencatat ${studentToRecord.name}`, {
                    description: result.error || "Gagal menghubungi database.",
                    icon: <AlertCircle className="h-5 w-5 text-red-500" />
                })
            }
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b19] transition-colors duration-300">
            {/* Desktop Sidebar */}
            <Sidebar user={currentUser} />

            {/* Mobile Bottom Nav */}
            <MobileBottomNav user={currentUser} />

            {/* Main Content Area */}
            <main className="md:pl-72 min-h-screen flex flex-col">
                <div className="flex-1 p-4 md:p-10 pb-28 md:pb-10 max-w-3xl w-full mx-auto animate-fade-in flex flex-col gap-6 select-none">
                    
                    {/* Header Branding */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Pencatatan Harian
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Cari data siswa dan catat keterlambatan secara instan.
                        </p>
                    </div>

                    {/* Simple Metrics Cards Section */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Total Telat Hari Ini Card */}
                        <div className="glass-card backdrop-blur-md bg-white/70 dark:bg-[#0f172a]/60 border border-slate-200/50 dark:border-white/5 rounded-3xl p-4 md:p-5 shadow-xs flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center border border-blue-600/20 dark:border-blue-400/25 text-blue-600 dark:text-blue-400 shrink-0">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                    Telat Hari Ini
                                </span>
                                <h4 className="text-base md:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                    {stats.tardiesToday} <span className="text-[10px] font-semibold text-slate-500">Siswa</span>
                                </h4>
                            </div>
                        </div>

                        {/* Top Kelas Telat Card */}
                        <div className="glass-card backdrop-blur-md bg-white/70 dark:bg-[#0f172a]/60 border border-slate-200/50 dark:border-white/5 rounded-3xl p-4 md:p-5 shadow-xs flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center border border-amber-500/20 dark:border-amber-400/25 text-amber-600 dark:text-amber-400 shrink-0">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                    Top Kelas Telat
                        </span>
                                <h4 className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-white mt-1 truncate" title={stats.topClass}>
                                    {stats.topClass}
                                </h4>
                            </div>
                        </div>
                    </div>

                    {/* Live Search Input Card */}
                    <div className="glass-card backdrop-blur-md bg-white/70 dark:bg-[#0f172a]/60 border border-slate-200/50 dark:border-white/5 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Cari Nama, NIS, atau Kelas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-slate-100 dark:bg-black/20 hover:bg-slate-200/50 dark:hover:bg-black/30 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 dark:focus:border-blue-500/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300 rounded-2xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Live Search Results container */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Hasil Pencarian ({filteredStudents.length} siswa)
                            </span>
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery("")}
                                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline border-none bg-transparent cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>

                        {filteredStudents.length === 0 ? (
                            <div className="glass-card bg-white/40 dark:bg-white/2 rounded-3xl p-10 border border-slate-200/50 dark:border-white/5 text-center flex flex-col items-center justify-center gap-2">
                                <AlertCircle className="h-8 w-8 text-slate-400 dark:text-slate-500 animate-pulse" />
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Tidak Ada Hasil</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                                    Siswa dengan kriteria "{searchQuery}" tidak ditemukan. Pastikan NIS atau ejaan nama sudah benar.
                                </p>
                            </div>
                        ) : (
                            /* Student Result List */
                            <div className="flex flex-col gap-3">
                                {filteredStudents.slice(0, 15).map((student) => {
                                    const hasTardies = student.tardiesCount > 0
                                    return (
                                        <button
                                            key={student.id}
                                            onClick={() => {
                                                setSelectedStudent(student)
                                                setReason("")
                                            }}
                                            className="w-full text-left glass-card bg-white/60 hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 border border-slate-200/40 dark:border-white/5 rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-xs transition-all duration-200 active:scale-99 focus:outline-none cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0",
                                                    hasTardies
                                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                                                        : "bg-slate-100 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400"
                                                )}>
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100">
                                                        {student.name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                        <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                            NIS {student.nis}
                                                        </span>
                                                        <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                            {student.kelas}
                                                        </span>
                                                        {student.jurusan && (
                                                            <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase">
                                                                {student.jurusan}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tardies Badge count */}
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-xs font-bold px-3 py-1.5 rounded-full border",
                                                    hasTardies
                                                        ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                                        : "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                                                )}>
                                                    {student.tardiesCount} Telat
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}

                                {filteredStudents.length > 15 && (
                                    <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-semibold py-2">
                                        Menampilkan 15 siswa pertama. Ketikkan nama lebih spesifik untuk memfilter.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* iOS Slide-up Bottom Sheet (Mobile) & Centered Dialog (Desktop) */}
                    {selectedStudent && isMounted && createPortal(
                        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs z-[100] animate-fade-in flex items-end md:items-center justify-center p-0 md:p-4">
                            {/* Backdrop Click Close */}
                            <div className="absolute inset-0" onClick={() => setSelectedStudent(null)} />

                            {/* Modal Container */}
                            <form 
                                onSubmit={handleSubmit}
                                className="relative w-full md:max-w-lg bg-white/95 dark:bg-[#0c1224]/95 backdrop-blur-2xl border-t md:border border-slate-200/50 dark:border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl p-5 md:p-6 z-10 animate-slide-up md:animate-scale-up flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden"
                            >
                                
                                {/* Drawer Drag bar for Mobile view */}
                                <div className="md:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 shrink-0" />

                                {/* Modal Header */}
                                <div className="flex items-center justify-between shrink-0 mb-3">
                                    <div>
                                        <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                                            Catat Keterlambatan
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                            {selectedStudent.name}
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStudent(null)}
                                        className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer border-none outline-none"
                                    >
                                        <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                    </button>
                                </div>

                                {/* Scrollable Intermediate Body */}
                                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 scrollbar-thin">
                                    {/* Student Details Card */}
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs flex flex-col gap-2 font-medium text-slate-600 dark:text-slate-300 shrink-0">
                                        <div className="flex justify-between">
                                            <span className="opacity-70">NIS Siswa</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">{selectedStudent.nis}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="opacity-70">Kelas</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">{selectedStudent.kelas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="opacity-70">Riwayat Terlambat</span>
                                            <span className={cn(
                                                "font-bold px-2 py-0.5 rounded-md",
                                                selectedStudent.tardiesCount > 0 ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-green-500/10 text-green-600 dark:text-green-400"
                                            )}>
                                                {selectedStudent.tardiesCount} Kali
                                            </span>
                                        </div>
                                    </div>

                                    {/* Alasan Input */}
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Alasan Terlambat
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Tulis alasan terlambat (opsional)..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 dark:focus:border-blue-500/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm font-medium"
                                        />
                                    </div>

                                    {/* Quick Select Reason Tags */}
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Pilih Cepat Alasan
                                        </span>
                                        {/* Swipeable row on mobile, wrapping on desktop */}
                                        <div className="flex overflow-x-auto md:flex-wrap gap-2 pb-2 md:pb-0 scrollbar-none pr-1 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {COMMON_REASONS.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => setReason(tag)}
                                                    className={cn(
                                                        "px-3 py-2 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0",
                                                        reason === tag
                                                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                                            : "bg-slate-100/70 border-slate-200/50 text-slate-600 dark:bg-white/5 dark:border-white/5 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/8"
                                                    )}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Footer (outside scrollable area) */}
                                <div className="flex gap-3 pt-4 mt-3 border-t border-slate-200/50 dark:border-white/5 shrink-0 bg-transparent">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStudent(null)}
                                        className="flex-1 h-11 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition active:scale-98 cursor-pointer border-none outline-none"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/10 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2 border-none outline-none"
                                    >
                                        <Clock className="h-4.5 w-4.5" />
                                        <span>Simpan Rekap</span>
                                    </button>
                                </div>
                            </form>
                        </div>,
                        document.body
                    )}
                </div>
            </main>
        </div>
    )
}
