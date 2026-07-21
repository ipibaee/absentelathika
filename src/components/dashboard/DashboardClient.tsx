"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { useVirtualizer } from "@tanstack/react-virtual"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { importStudents, createStudent, updateStudent, deleteStudent } from "@/actions/students"
import { deleteTardiness, updateTardinessReason } from "@/actions/tardiness"
import { 
    Users, 
    Clock, 
    CalendarRange, 
    TrendingUp, 
    Search, 
    Upload, 
    Eye, 
    X,
    FileSpreadsheet,
    AlertCircle,
    User,
    CheckCircle2,
    Plus,
    Pencil,
    Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TardinessRecord {
    id: string
    date: Date
    reason: string | null
}

interface StudentWithTardies {
    id: string
    nis: string
    name: string
    kelas: string
    jurusan: string | null
    tardies: TardinessRecord[]
}

interface DashboardClientProps {
    students: StudentWithTardies[]
    stats: {
        tardiesToday: number
        tardiesThisWeek: number
        totalStudents: number
        topClass: string
    }
}

export function DashboardClient({ students: initialStudents, stats }: DashboardClientProps) {
    const [students, setStudents] = useState<StudentWithTardies[]>(initialStudents)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedStudent, setSelectedStudent] = useState<StudentWithTardies | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // CRUD States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState<StudentWithTardies | null>(null)
    const [deletingStudent, setDeletingStudent] = useState<StudentWithTardies | null>(null)

    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
    const [editingRecordReason, setEditingRecordReason] = useState<string>("")
    
    // Form Inputs States
    const [formNis, setFormNis] = useState("")
    const [formName, setFormName] = useState("")
    const [formKelas, setFormKelas] = useState("")
    const [formJurusan, setFormJurusan] = useState("")
    const [formError, setFormError] = useState("")

    // Handle manual student creation
    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError("")
        
        const result = await createStudent({
            nis: formNis,
            name: formName,
            kelas: formKelas,
            jurusan: formJurusan
        })
        
        if (result.success && result.student) {
            const newStudentWithTardies: StudentWithTardies = {
                id: result.student.id,
                nis: result.student.nis,
                name: result.student.name,
                kelas: result.student.kelas,
                jurusan: result.student.jurusan,
                tardies: []
            }
            setStudents(prev => [newStudentWithTardies, ...prev])
            toast.success(`Berhasil menambahkan siswa: ${result.student.name}`)
            setIsAddModalOpen(false)
            resetForm()
        } else {
            setFormError(result.error || "Gagal menambahkan siswa.")
        }
    }

    // Handle student update
    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingStudent) return
        setFormError("")
        
        const result = await updateStudent(editingStudent.id, {
            nis: formNis,
            name: formName,
            kelas: formKelas,
            jurusan: formJurusan
        })
        
        if (result.success && result.student) {
            setStudents(prev => prev.map(s => s.id === editingStudent.id ? { 
                ...s, 
                nis: result.student!.nis,
                name: result.student!.name,
                kelas: result.student!.kelas,
                jurusan: result.student!.jurusan
            } : s))
            toast.success(`Berhasil memperbarui siswa: ${result.student.name}`)
            setEditingStudent(null)
            resetForm()
        } else {
            setFormError(result.error || "Gagal memperbarui siswa.")
        }
    }

    // Handle student deletion
    const handleDeleteStudent = async () => {
        if (!deletingStudent) return
        
        const result = await deleteStudent(deletingStudent.id)
        if (result.success) {
            setStudents(prev => prev.filter(s => s.id !== deletingStudent.id))
            toast.success(`Berhasil menghapus siswa: ${deletingStudent.name}`)
            setDeletingStudent(null)
        } else {
            toast.error(result.error || "Gagal menghapus siswa.")
        }
    }

    // Handle individual tardiness deletion
    const handleDeleteTardiness = async (tardinessId: string, studentId: string) => {
        const result = await deleteTardiness(tardinessId)
        if (result.success) {
            setStudents(prev => prev.map(s => {
                if (s.id === studentId) {
                    return { ...s, tardies: s.tardies.filter(t => t.id !== tardinessId) }
                }
                return s
            }))
            setSelectedStudent(prev => {
                if (prev && prev.id === studentId) {
                    return { ...prev, tardies: prev.tardies.filter(t => t.id !== tardinessId) }
                }
                return prev
            })
            toast.success("Berhasil menghapus catatan keterlambatan.")
        } else {
            toast.error(result.error || "Gagal menghapus catatan.")
        }
    }

    // Handle saving of updated tardiness reason
    const handleSaveRecordReason = async (tardinessId: string, studentId: string) => {
        const result = await updateTardinessReason(tardinessId, editingRecordReason)
        if (result.success) {
            setStudents(prev => prev.map(s => {
                if (s.id === studentId) {
                    return {
                        ...s,
                        tardies: s.tardies.map(t => t.id === tardinessId ? { ...t, reason: editingRecordReason } : t)
                    }
                }
                return s
            }))
            setSelectedStudent(prev => {
                if (prev && prev.id === studentId) {
                    return {
                        ...prev,
                        tardies: prev.tardies.map(t => t.id === tardinessId ? { ...t, reason: editingRecordReason } : t)
                    }
                }
                return prev
            })
            setEditingRecordId(null)
            toast.success("Berhasil memperbarui alasan keterlambatan.")
        } else {
            toast.error(result.error || "Gagal memperbarui data.")
        }
    }

    const resetForm = () => {
        setFormNis("")
        setFormName("")
        setFormKelas("")
        setFormJurusan("")
        setFormError("")
    }

    const openEditModal = (student: StudentWithTardies) => {
        setEditingStudent(student)
        setFormNis(student.nis)
        setFormName(student.name)
        setFormKelas(student.kelas)
        setFormJurusan(student.jurusan || "")
        setFormError("")
    }

    // Filter students by query
    const filteredStudents = useMemo(() => {
        const query = searchQuery.toLowerCase()
        if (!query) return students
        return students.filter(s => 
            s.name.toLowerCase().includes(query) ||
            s.nis.includes(query) ||
            s.kelas.toLowerCase().includes(query)
        )
    }, [students, searchQuery])

    // Virtualization setup
    const parentRef = useRef<HTMLDivElement>(null)
    const rowVirtualizer = useVirtualizer({
        count: filteredStudents.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64, // row height in pixels
        overscan: 10,
    })

    // Handle excel upload parsing (SheetJS)
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        const reader = new FileReader()
        
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: "binary" })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json<any>(ws)

                if (data.length === 0) {
                    toast.error("File Excel kosong.")
                    setIsImporting(false)
                    return
                }

                // Check formats and maps
                const formatted = data.map((row: any) => {
                    const nis = row.nis || row.NIS || row.Nis || row["Nomor Induk"] || row["Nomor Induk Siswa"]
                    const name = row.nama || row.Nama || row.NAMA || row.name || row.Name
                    const kelas = row.kelas || row.Kelas || row.KELAS || row.class || row.Class
                    const jurusan = row.jurusan || row.Jurusan || row.JURUSAN || row.dept || row.department

                    return {
                        nis: nis ? String(nis).trim() : "",
                        name: name ? String(name).trim() : "",
                        kelas: kelas ? String(kelas).trim() : "",
                        jurusan: jurusan ? String(jurusan).trim() : ""
                    }
                }).filter(item => item.nis && item.name && item.kelas)

                if (formatted.length === 0) {
                    toast.error("Format kolom salah. Pastikan minimal ada kolom 'nis', 'nama', dan 'kelas'.")
                    setIsImporting(false)
                    return
                }

                const result = await importStudents(formatted)
                if (result.success) {
                    toast.success(`Berhasil mengimpor ${result.count} dari ${result.totalProcessed} siswa baru!`, {
                        description: "Daftar siswa sudah diperbarui."
                    })
                    // Reload window to update server data state or refetch (reload is simple and resets counts)
                    setTimeout(() => window.location.reload(), 1500)
                } else {
                    toast.error(result.error || "Impor gagal.")
                }
            } catch (error) {
                console.error(error)
                toast.error("Gagal membaca file Excel. Pastikan format file sesuai (.xls / .xlsx).")
            } finally {
                setIsImporting(false)
                if (fileInputRef.current) fileInputRef.current.value = ""
            }
        }
        reader.readAsBinaryString(file)
    }

    return (
        <div className="flex flex-col gap-6 select-none">
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Dasbor Rekapitulasi
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Rekap data keterlambatan siswa SMK HKTI 2 Purwareja Klampok.
                    </p>
                </div>

                {/* Actions container: Download Template, Manual Add, and Import Excel */}
                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href="/api/download-template"
                        className="inline-flex items-center gap-2 px-5 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-white/5 active:scale-98 transition duration-200 cursor-pointer select-none outline-none"
                    >
                        <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Unduh Template</span>
                    </a>

                    <button
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="inline-flex items-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl shadow-sm hover:shadow active:scale-98 transition duration-200 cursor-pointer select-none outline-none"
                    >
                        <Plus className="h-4.5 w-4.5" />
                        <span>Tambah Manual</span>
                    </button>

                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        ref={fileInputRef}
                        onChange={handleExcelUpload}
                        className="hidden"
                        id="excel-file-input"
                        disabled={isImporting}
                    />
                    <label
                        htmlFor="excel-file-input"
                        className={cn(
                            "inline-flex items-center gap-2 px-5 h-11 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-semibold rounded-2xl shadow-sm hover:shadow active:scale-98 transition duration-200 cursor-pointer select-none",
                            isImporting && "opacity-75 pointer-events-none"
                        )}
                    >
                        {isImporting ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Mengimpor...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="h-4.5 w-4.5" />
                                <span>Import Data Siswa</span>
                            </>
                        )}
                    </label>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1 */}
                <div className="glass-card bg-white/70 dark:bg-[#0f172a]/60 border border-slate-200/50 dark:border-white/5 p-4 rounded-3xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-500">
                        <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/10">
                            <Clock className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Telat Hari Ini
                        </span>
                    </div>
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {stats.tardiesToday}
                    </span>
                </div>

                {/* Metric 2 */}
                <div className="glass-card bg-white/70 dark:bg-[#0f172a]/60 border border-slate-200/50 dark:border-white/5 p-4 rounded-3xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-amber-500">
                        <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                            <CalendarRange className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Telat Minggu Ini
                        </span>
                    </div>
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {stats.tardiesThisWeek}
                    </span>
                </div>

                {/* Metric 3 */}
                <div className="glass-card bg-white/70 dark:bg-[#0f172a]/60 border border-slate-200/50 dark:border-white/5 p-4 rounded-3xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-blue-500">
                        <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                            <Users className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Siswa
                        </span>
                    </div>
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {stats.totalStudents}
                    </span>
                </div>

                {/* Metric 4 */}
                <div className="glass-card bg-white/70 dark:bg-[#0f172a]/60 border border-slate-200/50 dark:border-white/5 p-4 rounded-3xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-purple-500">
                        <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/10">
                            <TrendingUp className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Top Kelas Telat
                        </span>
                    </div>
                    <span className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white mt-2.5 truncate">
                        {stats.topClass}
                    </span>
                </div>
            </div>

            {/* Virtualized Student Table Card */}
            <div className="glass-card bg-white/60 dark:bg-[#0f172a]/40 border border-slate-200/40 dark:border-white/5 rounded-3xl shadow-sm p-4 md:p-6 flex flex-col gap-4">
                
                {/* Search / Filter bar inside Table */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white">
                        Daftar Rekap Keterlambatan Siswa ({filteredStudents.length})
                    </h3>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Filter Nama, NIS, atau Kelas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-10 pr-3.5 bg-slate-100 dark:bg-black/20 hover:bg-slate-200/50 dark:hover:bg-black/30 border border-slate-200/50 dark:border-white/5 focus:border-blue-500/50 dark:focus:border-blue-500/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-xs font-semibold"
                        />
                    </div>
                </div>

                {/* The Virtualized Table */}
                <div className="border border-slate-200/50 dark:border-white/5 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-black/10">
                    
                    {/* Header Columns */}
                    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_110px] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_130px] bg-slate-100 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 py-3 select-none">
                        <span>Nama</span>
                        <span>NIS</span>
                        <span>Kelas</span>
                        <span>Jurusan</span>
                        <span className="text-center">Total Telat</span>
                        <span className="text-right">Aksi</span>
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className="p-12 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                            Tidak ada data rekap siswa yang sesuai dengan filter.
                        </div>
                    ) : (
                        /* Scrollable parent viewport for virtualization */
                        <div 
                            ref={parentRef} 
                            className="overflow-y-auto max-h-[500px] scrollbar-none"
                        >
                            {/* Inner scrolling element */}
                            <div
                                style={{
                                    height: `${rowVirtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const student = filteredStudents[virtualRow.index]
                                    const isCritical = student.tardies.length >= 3
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            className={cn(
                                                "grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_110px] md:grid-cols-[2fr_1fr_1fr_1fr_1fr_130px] items-center px-4 border-b border-slate-200/30 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100/30 dark:hover:bg-white/2 transition duration-150",
                                                virtualRow.index % 2 === 0 ? "bg-white/20 dark:bg-black/5" : "bg-transparent"
                                            )}
                                        >
                                            <span className="font-bold text-slate-900 dark:text-slate-200 truncate pr-2">
                                                {student.name}
                                            </span>
                                            <span className="font-mono">{student.nis}</span>
                                            <span>{student.kelas}</span>
                                            <span className="uppercase">{student.jurusan || "-"}</span>
                                            
                                            {/* Late Badge Status */}
                                            <div className="flex justify-center">
                                                <span className={cn(
                                                    "inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border text-center min-w-[50px]",
                                                    student.tardies.length === 0
                                                        ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                                                        : isCritical
                                                        ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 animate-pulse"
                                                        : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                                                )}>
                                                    {student.tardies.length}x
                                                </span>
                                            </div>

                                            {/* Details, Edit, Delete Actions */}
                                            <div className="flex justify-end items-center gap-1">
                                                <button
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition duration-150 flex items-center justify-center cursor-pointer border border-slate-200/50 dark:border-white/5 outline-none active:scale-95 shrink-0"
                                                    title="Lihat Detail Riwayat"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(student)}
                                                    className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 transition duration-150 flex items-center justify-center cursor-pointer border border-slate-200/50 dark:border-white/5 outline-none active:scale-95 shrink-0"
                                                    title="Edit Data Siswa"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingStudent(student)}
                                                    className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition duration-150 flex items-center justify-center cursor-pointer border border-slate-200/50 dark:border-white/5 outline-none active:scale-95 shrink-0"
                                                    title="Hapus Siswa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* iOS Bottom Sheet: Late Records Details */}
            {selectedStudent && isMounted && createPortal(
                <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs z-[100] animate-fade-in flex items-end md:items-center justify-center p-0 md:p-4">
                    {/* Backdrop Click Close */}
                    <div className="absolute inset-0" onClick={() => setSelectedStudent(null)} />

                    {/* Sheet Content Card */}
                    <div className="relative w-full md:max-w-lg bg-white/95 dark:bg-[#0c1224]/95 backdrop-blur-2xl border-t md:border border-slate-200/50 dark:border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl p-5 md:p-6 z-10 animate-slide-up md:animate-scale-up flex flex-col max-h-[85vh] md:max-h-[80vh] overflow-hidden">
                        
                        {/* Mobile handle indicator */}
                        <div className="md:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 shrink-0" />

                        {/* Modal Header */}
                        <div className="flex items-center justify-between shrink-0 mb-3">
                            <div>
                                <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                                    Riwayat Keterlambatan
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                    {selectedStudent.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Kelas {selectedStudent.kelas} &bull; NIS {selectedStudent.nis}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer border-none outline-none"
                            >
                                <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Timeline List of Tardies (Scrollable intermediate body) */}
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 mt-2 scrollbar-thin">
                            {selectedStudent.tardies.length === 0 ? (
                                <div className="p-8 rounded-2xl bg-green-500/10 border border-green-500/20 text-center flex flex-col items-center justify-center gap-2">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    <h4 className="font-bold text-green-800 dark:text-green-300 text-xs">Siswa Sangain Rajin</h4>
                                    <p className="text-[10px] text-green-600 dark:text-green-400">Belum ada rekap keterlambatan tercatat untuk siswa ini.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3.5 pr-1">
                                    {selectedStudent.tardies.map((record, index) => {
                                        const dateObj = new Date(record.date)
                                        const formattedDate = dateObj.toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        })
                                        const formattedTime = dateObj.toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })
                                        return (
                                            <div 
                                                key={record.id}
                                                className="flex gap-4 items-start relative pl-1"
                                            >
                                                {/* Connecting timeline dot & line */}
                                                <div className="flex flex-col items-center shrink-0 mt-1">
                                                    <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400 ring-4 ring-blue-500/10" />
                                                    {index < selectedStudent.tardies.length - 1 && (
                                                        <div className="w-[1.5px] h-12 bg-slate-200 dark:bg-white/10 mt-1" />
                                                    )}
                                                </div>
 
                                                {/* Record Detail Box */}
                                                <div className="flex-1 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-1">
                                                            <span>{formattedDate}</span>
                                                            <span className="text-[10px] bg-slate-200/50 dark:bg-white/5 px-2 py-0.5 rounded-md font-semibold text-slate-500">
                                                                {formattedTime} WIB
                                                            </span>
                                                        </div>
                                                        {editingRecordId === record.id ? (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <input
                                                                    type="text"
                                                                    value={editingRecordReason}
                                                                    onChange={(e) => setEditingRecordReason(e.target.value)}
                                                                    className="flex-1 h-8 px-2.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-blue-500/30 text-xs text-slate-800 dark:text-slate-100"
                                                                    placeholder="Tulis alasan baru..."
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSaveRecordReason(record.id, selectedStudent.id)}
                                                                    className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition active:scale-95 border-none cursor-pointer"
                                                                >
                                                                    Simpan
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingRecordId(null)}
                                                                    className="h-8 px-2.5 rounded-lg bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 font-semibold text-[10px] transition active:scale-95 border-none cursor-pointer"
                                                                >
                                                                    Batal
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                                                Alasan: <span className="font-semibold text-slate-900 dark:text-slate-200">{record.reason || "Tanpa alasan"}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                setEditingRecordId(record.id)
                                                                setEditingRecordReason(record.reason || "")
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition shrink-0 cursor-pointer border border-transparent hover:border-blue-500/10 outline-none active:scale-95"
                                                            title="Ubah Alasan"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTardiness(record.id, selectedStudent.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition shrink-0 cursor-pointer border border-transparent hover:border-red-500/10 outline-none active:scale-95"
                                                            title="Hapus Rekap Ini"
                                                        >
                                                            <Trash2 className="h-4.5 w-4.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Action Close (Sticky) */}
                        <div className="mt-4 shrink-0 pt-3 border-t border-slate-200/50 dark:border-white/5">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-sm active:scale-98 transition cursor-pointer border-none outline-none"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Tambah Siswa Manual Modal */}
            {isAddModalOpen && isMounted && createPortal(
                <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs z-[100] animate-fade-in flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0" onClick={() => { setIsAddModalOpen(false); resetForm(); }} />
                    <div className="relative w-full md:max-w-md bg-white/95 dark:bg-[#0c1224]/95 backdrop-blur-2xl border-t md:border border-slate-200/50 dark:border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl p-5 md:p-6 z-10 animate-slide-up md:animate-scale-up flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden">
                        <div className="flex items-center justify-between shrink-0 mb-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tambah Siswa Manual</h3>
                            <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition border-none outline-none">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateStudent} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 pb-2 scrollbar-thin">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">NIS (Nomor Induk Siswa)</label>
                                    <input type="text" value={formNis} onChange={e => setFormNis(e.target.value)} required className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" placeholder="Contoh: 10243" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" placeholder="Contoh: Ahmad Fauzi" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Kelas</label>
                                    <input type="text" value={formKelas} onChange={e => setFormKelas(e.target.value)} required className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" placeholder="Contoh: X PPLG 1" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Jurusan (Opsional)</label>
                                    <input type="text" value={formJurusan} onChange={e => setFormJurusan(e.target.value)} className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" placeholder="Contoh: PPLG" />
                                </div>
                                {formError && (
                                    <p className="text-xs font-bold text-red-500 text-center">{formError}</p>
                                )}
                            </div>
                            <div className="flex gap-3 mt-4 pt-3 border-t border-slate-200/50 dark:border-white/5 shrink-0">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="flex-1 h-11 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition border-none outline-none">Batal</button>
                                <button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition shadow-lg shadow-blue-500/10 border-none outline-none">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Siswa Modal */}
            {editingStudent && isMounted && createPortal(
                <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs z-[100] animate-fade-in flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0" onClick={() => { setEditingStudent(null); resetForm(); }} />
                    <div className="relative w-full md:max-w-md bg-white/95 dark:bg-[#0c1224]/95 backdrop-blur-2xl border-t md:border border-slate-200/50 dark:border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl p-5 md:p-6 z-10 animate-slide-up md:animate-scale-up flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden">
                        <div className="flex items-center justify-between shrink-0 mb-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Ubah Data Siswa</h3>
                            <button onClick={() => { setEditingStudent(null); resetForm(); }} className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition border-none outline-none">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateStudent} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 pb-2 scrollbar-thin">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">NIS (Nomor Induk Siswa)</label>
                                    <input type="text" value={formNis} onChange={e => setFormNis(e.target.value)} required className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Kelas</label>
                                    <input type="text" value={formKelas} onChange={e => setFormKelas(e.target.value)} required className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Jurusan (Opsional)</label>
                                    <input type="text" value={formJurusan} onChange={e => setFormJurusan(e.target.value)} className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" />
                                </div>
                                {formError && (
                                    <p className="text-xs font-bold text-red-500 text-center">{formError}</p>
                                )}
                            </div>
                            <div className="flex gap-3 mt-4 pt-3 border-t border-slate-200/50 dark:border-white/5 shrink-0">
                                <button type="button" onClick={() => { setEditingStudent(null); resetForm(); }} className="flex-1 h-11 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition border-none outline-none">Batal</button>
                                <button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition shadow-lg shadow-blue-500/10 border-none outline-none">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Hapus Siswa Confirmation Dialog */}
            {deletingStudent && isMounted && createPortal(
                <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs z-[100] animate-fade-in flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={() => setDeletingStudent(null)} />
                    <div className="relative w-full max-w-sm bg-white/95 dark:bg-[#0c1224]/95 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-2xl p-6 z-10 animate-scale-up flex flex-col gap-4 text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-2 border border-red-500/10">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Hapus Data Siswa?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                Apakah Anda yakin ingin menghapus <strong>{deletingStudent.name}</strong>? Tindakan ini bersifat permanen dan akan menghapus semua riwayat keterlambatannya ({deletingStudent.tardies.length} rekap).
                            </p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <button type="button" onClick={() => setDeletingStudent(null)} className="flex-1 h-11 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition border-none outline-none">Batal</button>
                            <button type="button" onClick={handleDeleteStudent} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-md shadow-red-500/10 border-none outline-none">Hapus</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
