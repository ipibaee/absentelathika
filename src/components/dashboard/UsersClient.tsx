"use client"

import { useState } from "react"
import { toast } from "sonner"
import { 
    updateOwnProfile, 
    createUserAction, 
    updateUserAction, 
    deleteUserAction 
} from "@/actions/users"
import { 
    User, 
    Shield, 
    Lock, 
    Plus, 
    Pencil, 
    Trash2, 
    X, 
    UserCheck, 
    KeyRound, 
    CheckCircle2, 
    AlertCircle 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UserItem {
    id: string
    username: string
    role: string
}

interface UsersClientProps {
    initialUsers: UserItem[]
    currentUser: {
        id?: string
        username?: string
        role?: string
    }
}

export function UsersClient({ initialUsers, currentUser }: UsersClientProps) {
    const [users, setUsers] = useState<UserItem[]>(initialUsers)
    
    // Own Profile States
    const [ownUsername, setOwnUsername] = useState(currentUser.username || "")
    const [ownPassword, setOwnPassword] = useState("")
    const [isUpdatingOwn, setIsUpdatingOwn] = useState(false)

    // User CRUD States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserItem | null>(null)
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null)
    
    // Form States
    const [formUsername, setFormUsername] = useState("")
    const [formPassword, setFormPassword] = useState("")
    const [formRole, setFormRole] = useState("PIKET") // Default to PIKET
    const [formError, setFormError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Handle Profile Change
    const handleUpdateOwnProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!ownUsername.trim()) {
            toast.error("Username tidak boleh kosong.")
            return
        }
        
        setIsUpdatingOwn(true)
        try {
            const result = await updateOwnProfile({
                username: ownUsername,
                password: ownPassword ? ownPassword : undefined
            })
            
            if (result.success) {
                toast.success("Profil Anda berhasil diperbarui!", {
                    description: ownPassword ? "Username & password baru disimpan." : "Username baru disimpan."
                })
                setOwnPassword("")
                // Update local list if name matches
                setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, username: ownUsername } : u))
            } else {
                toast.error(result.error || "Gagal memperbarui profil.")
            }
        } catch (err) {
            console.error(err)
            toast.error("Terjadi kesalahan sistem.")
        } finally {
            setIsUpdatingOwn(false)
        }
    }

    // Handle Create User
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError("")
        
        if (!formUsername.trim()) {
            setFormError("Username wajib diisi.")
            return
        }
        if (!formPassword.trim()) {
            setFormError("Password wajib diisi.")
            return
        }
        
        setIsSubmitting(true)
        try {
            const result = await createUserAction({
                username: formUsername,
                password: formPassword,
                role: formRole
            })
            
            if (result.success && result.user) {
                setUsers(prev => [...prev, result.user!].sort((a, b) => a.username.localeCompare(b.username)))
                toast.success(`User '${formUsername}' berhasil dibuat!`)
                setIsAddModalOpen(false)
                resetForm()
            } else {
                setFormError(result.error || "Gagal membuat user.")
            }
        } catch (err) {
            console.error(err)
            setFormError("Terjadi kesalahan.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle Update User
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return
        setFormError("")
        
        if (!formUsername.trim()) {
            setFormError("Username tidak boleh kosong.")
            return
        }
        
        setIsSubmitting(true)
        try {
            const result = await updateUserAction(editingUser.id, {
                username: formUsername,
                password: formPassword ? formPassword : undefined,
                role: formRole
            })
            
            if (result.success && result.user) {
                setUsers(prev => prev.map(u => u.id === editingUser.id ? result.user! : u))
                toast.success(`User '${formUsername}' berhasil diperbarui!`)
                setEditingUser(null)
                resetForm()
            } else {
                setFormError(result.error || "Gagal memperbarui user.")
            }
        } catch (err) {
            console.error(err)
            setFormError("Terjadi kesalahan.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle Delete User
    const handleDeleteUser = async () => {
        if (!deletingUser) return
        
        try {
            const result = await deleteUserAction(deletingUser.id)
            if (result.success) {
                setUsers(prev => prev.filter(u => u.id !== deletingUser.id))
                toast.success(`User '${deletingUser.username}' berhasil dihapus.`)
                setDeletingUser(null)
            } else {
                toast.error(result.error || "Gagal menghapus user.")
            }
        } catch (err) {
            console.error(err)
            toast.error("Terjadi kesalahan.")
        }
    }

    const resetForm = () => {
        setFormUsername("")
        setFormPassword("")
        setFormRole("PIKET")
        setFormError("")
    }

    const openEditModal = (user: UserItem) => {
        setEditingUser(user)
        setFormUsername(user.username)
        setFormRole(user.role)
        setFormPassword("")
        setFormError("")
    }

    return (
        <div className="flex flex-col gap-6 select-none max-w-4xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Pengaturan & Pengguna
                </h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Kelola profil akun Admin Anda dan daftar user piket sekolah.
                </p>
            </div>

            {/* Grid for Settings Layout */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Profile Form Card: 2 Cols */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    <div className="glass-card bg-white/60 dark:bg-[#0f172a]/40 border border-slate-200/50 dark:border-white/5 rounded-3xl p-5 md:p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-slate-900 dark:text-white border-b border-slate-200/50 dark:border-white/5 pb-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center border border-blue-600/10 dark:border-blue-400/10 text-blue-600 dark:text-blue-400 shrink-0">
                                <KeyRound className="h-5 w-5" />
                            </div>
                            <h3 className="font-extrabold text-sm md:text-base">Profil Akun Saya</h3>
                        </div>

                        <form onSubmit={handleUpdateOwnProfile} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Username Admin</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                                    <input 
                                        type="text" 
                                        value={ownUsername} 
                                        onChange={e => setOwnUsername(e.target.value)} 
                                        required 
                                        className="w-full h-11 pl-11 pr-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white font-medium"
                                        placeholder="Username"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Password Baru</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                                    <input 
                                        type="password" 
                                        value={ownPassword} 
                                        onChange={e => setOwnPassword(e.target.value)} 
                                        className="w-full h-11 pl-11 pr-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white font-medium"
                                        placeholder="Kosongkan jika tetap"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isUpdatingOwn}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold rounded-2xl transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                                {isUpdatingOwn ? (
                                    <>
                                        <div className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>Simpan Akun Saya</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Users CRUD Table Card: 3 Cols */}
                <div className="md:col-span-3 flex flex-col gap-4">
                    <div className="glass-card bg-white/60 dark:bg-[#0f172a]/40 border border-slate-200/50 dark:border-white/5 rounded-3xl p-5 md:p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 dark:border-white/5 pb-3">
                            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                                <div className="h-9 w-9 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center border border-blue-600/10 dark:border-blue-400/10 text-blue-600 dark:text-blue-400 shrink-0">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <h3 className="font-extrabold text-sm md:text-base">Daftar Pengguna Sistem</h3>
                            </div>

                            <button 
                                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                                className="inline-flex items-center gap-1.5 px-3.5 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl active:scale-98 transition cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Tambah User</span>
                            </button>
                        </div>

                        {/* Responsive Scrollable List Table */}
                        <div className="border border-slate-200/50 dark:border-white/5 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-black/10">
                            {/* Columns Header */}
                            <div className="grid grid-cols-[2fr_1fr_100px] bg-slate-100 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-4 py-3 select-none">
                                <span>Username</span>
                                <span>Role</span>
                                <span className="text-right">Aksi</span>
                            </div>

                            {users.length === 0 ? (
                                <div className="p-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Belum ada pengguna piket lain.
                                </div>
                            ) : (
                                <div className="flex flex-col max-h-[350px] overflow-y-auto">
                                    {users.map((u) => {
                                        const isSelf = u.id === currentUser.id
                                        return (
                                            <div 
                                                key={u.id}
                                                className="grid grid-cols-[2fr_1fr_100px] items-center px-4 py-2.5 border-b border-slate-200/30 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100/30 dark:hover:bg-white/2 transition duration-150 bg-white/20 dark:bg-black/5"
                                            >
                                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate pr-2 flex items-center gap-1.5">
                                                    {u.username}
                                                    {isSelf && (
                                                        <span className="inline-block text-[9px] bg-blue-500/15 border border-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded-md font-semibold font-sans">Saya</span>
                                                    )}
                                                </span>
                                                <span className={cn(
                                                    "inline-flex font-semibold w-fit text-[10px] px-2 py-0.5 rounded-md",
                                                    u.role === "ADMIN" 
                                                        ? "bg-purple-500/15 border border-purple-500/10 text-purple-600 dark:text-purple-400 font-bold" 
                                                        : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                                                )}>
                                                    {u.role}
                                                </span>

                                                {/* Actions */}
                                                <div className="flex justify-end items-center gap-1.5">
                                                    <button 
                                                        onClick={() => openEditModal(u)}
                                                        className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 transition duration-150 flex items-center justify-center cursor-pointer border border-slate-200/50 dark:border-white/5 outline-none active:scale-95 shrink-0"
                                                        title="Edit User"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeletingUser(u)}
                                                        disabled={isSelf}
                                                        className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition duration-150 flex items-center justify-center cursor-pointer border border-slate-200/50 dark:border-white/5 outline-none active:scale-95 shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                                                        title={isSelf ? "Anda tidak dapat menghapus diri sendiri" : "Hapus User"}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tambah User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs z-50 animate-fade-in flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0" onClick={() => { setIsAddModalOpen(false); resetForm(); }} />
                    <div className="relative w-full md:max-w-md bg-white/95 dark:bg-[#0c1224]/95 backdrop-blur-2xl border-t md:border border-slate-200/50 dark:border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl p-6 pb-10 md:pb-6 z-10 animate-slide-up md:animate-scale-up flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tambah Pengguna Baru</h3>
                            <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Username</label>
                                <input 
                                    type="text" 
                                    value={formUsername} 
                                    onChange={e => setFormUsername(e.target.value)} 
                                    required 
                                    className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" 
                                    placeholder="Contoh: piket2" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Password</label>
                                <input 
                                    type="password" 
                                    value={formPassword} 
                                    onChange={e => setFormPassword(e.target.value)} 
                                    required 
                                    className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" 
                                    placeholder="Password baru" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Peran / Role</label>
                                <select 
                                    value={formRole} 
                                    onChange={e => setFormRole(e.target.value)}
                                    className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white"
                                >
                                    <option value="PIKET" className="bg-slate-100 dark:bg-[#0c1224] text-slate-950 dark:text-white">GURU PIKET</option>
                                    <option value="ADMIN" className="bg-slate-100 dark:bg-[#0c1224] text-slate-950 dark:text-white">ADMINISTRATOR</option>
                                </select>
                            </div>
                            {formError && (
                                <p className="text-xs font-bold text-red-500 text-center">{formError}</p>
                            )}
                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="flex-1 h-12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-semibold rounded-2xl transition flex items-center justify-center">
                                    {isSubmitting ? <div className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Simpan</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs z-50 animate-fade-in flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0" onClick={() => { setEditingUser(null); resetForm(); }} />
                    <div className="relative w-full md:max-w-md bg-white/95 dark:bg-[#0c1224]/95 backdrop-blur-2xl border-t md:border border-slate-200/50 dark:border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl p-6 pb-10 md:pb-6 z-10 animate-slide-up md:animate-scale-up flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Ubah Data Pengguna</h3>
                            <button onClick={() => { setEditingUser(null); resetForm(); }} className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Username</label>
                                <input 
                                    type="text" 
                                    value={formUsername} 
                                    onChange={e => setFormUsername(e.target.value)} 
                                    required 
                                    className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Password Baru (Opsional)</label>
                                <input 
                                    type="password" 
                                    value={formPassword} 
                                    onChange={e => setFormPassword(e.target.value)} 
                                    className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white" 
                                    placeholder="Kosongkan jika tetap" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Peran / Role</label>
                                <select 
                                    value={formRole} 
                                    onChange={e => setFormRole(e.target.value)}
                                    className="w-full h-11 px-4 bg-slate-100 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500/30 text-sm text-slate-900 dark:text-white"
                                >
                                    <option value="PIKET" className="bg-slate-100 dark:bg-[#0c1224] text-slate-950 dark:text-white">GURU PIKET</option>
                                    <option value="ADMIN" className="bg-slate-100 dark:bg-[#0c1224] text-slate-950 dark:text-white">ADMINISTRATOR</option>
                                </select>
                            </div>
                            {formError && (
                                <p className="text-xs font-bold text-red-500 text-center">{formError}</p>
                            )}
                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => { setEditingUser(null); resetForm(); }} className="flex-1 h-12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-semibold rounded-2xl transition flex items-center justify-center">
                                    {isSubmitting ? <div className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Simpan Perubahan</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hapus User Confirmation Dialog */}
            {deletingUser && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs z-50 animate-fade-in flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={() => setDeletingUser(null)} />
                    <div className="relative w-full max-w-sm bg-white/95 dark:bg-[#0c1224]/95 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-2xl p-6 z-10 animate-scale-up flex flex-col gap-4 text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-2 border border-red-500/10">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Hapus Pengguna?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                Apakah Anda yakin ingin menghapus akun user <strong>{deletingUser.username}</strong> ({deletingUser.role})? Tindakan ini bersifat permanen.
                            </p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <button type="button" onClick={() => setDeletingUser(null)} className="flex-1 h-11 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition">Batal</button>
                            <button type="button" onClick={handleDeleteUser} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-md shadow-red-500/10">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
