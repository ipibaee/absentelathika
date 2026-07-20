"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

// Guard helper to verify if request is from an Admin
async function requireAdmin() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Akses ditolak. Anda harus login sebagai Admin.")
    }
    return session
}

export async function getUsers() {
    await requireAdmin()
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true
            },
            orderBy: {
                username: "asc"
            }
        })
        return { success: true, users }
    } catch (error) {
        console.error("Gagal memuat pengguna:", error)
        return { success: false, error: "Gagal memuat daftar pengguna." }
    }
}

export async function updateOwnProfile(data: { username: string, password?: string }) {
    const session = await requireAdmin()
    const currentUserId = session.user.id
    
    const username = data.username.trim()
    if (!username) {
        return { success: false, error: "Username tidak boleh kosong." }
    }

    try {
        // Check if username is already taken by another user
        const existing = await prisma.user.findFirst({
            where: {
                username,
                NOT: { id: currentUserId }
            }
        })
        if (existing) {
            return { success: false, error: "Username sudah digunakan." }
        }

        const updateData: any = { username }
        
        if (data.password && data.password.trim() !== "") {
            updateData.password = await bcrypt.hash(data.password.trim(), 10)
        }

        await prisma.user.update({
            where: { id: currentUserId },
            data: updateData
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Gagal memperbarui profil:", error)
        return { success: false, error: "Gagal memperbarui profil." }
    }
}

export async function createUserAction(data: { username: string, password?: string, role: string }) {
    await requireAdmin()
    
    const username = data.username.trim()
    const rawPassword = data.password ? data.password.trim() : ""
    const role = data.role === "ADMIN" ? "ADMIN" : "PIKET"

    if (!username) {
        return { success: false, error: "Username wajib diisi." }
    }
    if (!rawPassword) {
        return { success: false, error: "Password wajib diisi." }
    }

    try {
        const existing = await prisma.user.findUnique({
            where: { username }
        })
        if (existing) {
            return { success: false, error: `User dengan username '${username}' sudah terdaftar.` }
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 10)

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role
            },
            select: {
                id: true,
                username: true,
                role: true
            }
        })

        return { success: true, user: newUser }
    } catch (error) {
        console.error("Gagal membuat user baru:", error)
        return { success: false, error: "Gagal menyimpan user baru." }
    }
}

export async function updateUserAction(id: string, data: { username: string, password?: string, role: string }) {
    await requireAdmin()
    
    const username = data.username.trim()
    const role = data.role === "ADMIN" ? "ADMIN" : "PIKET"

    if (!username) {
        return { success: false, error: "Username tidak boleh kosong." }
    }

    try {
        // Check conflicts
        const conflict = await prisma.user.findFirst({
            where: {
                username,
                NOT: { id }
            }
        })
        if (conflict) {
            return { success: false, error: "Username sudah digunakan oleh user lain." }
        }

        const updateData: any = { username, role }
        
        if (data.password && data.password.trim() !== "") {
            updateData.password = await bcrypt.hash(data.password.trim(), 10)
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                role: true
            }
        })

        return { success: true, user: updated }
    } catch (error) {
        console.error("Gagal memperbarui user:", error)
        return { success: false, error: "Gagal memperbarui data user." }
    }
}

export async function deleteUserAction(id: string) {
    const session = await requireAdmin()
    
    if (session.user.id === id) {
        return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." }
    }

    try {
        await prisma.user.delete({
            where: { id }
        })
        return { success: true }
    } catch (error) {
        console.error("Gagal menghapus user:", error)
        return { success: false, error: "Gagal menghapus user." }
    }
}
