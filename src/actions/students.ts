"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

interface ImportStudentInput {
    nis: string
    name: string
    kelas: string
    jurusan?: string
}

export async function importStudents(students: ImportStudentInput[]) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Akses ditolak. Hanya Admin yang dapat mengimpor data.")
    }

    if (!Array.isArray(students) || students.length === 0) {
        return { success: false, error: "Data siswa kosong." }
    }

    try {
        // Normalize fields
        const normalizedData = students.map(s => ({
            nis: String(s.nis).trim(),
            name: s.name.trim(),
            kelas: s.kelas.trim(),
            jurusan: s.jurusan ? s.jurusan.trim() : null
        })).filter(s => s.nis && s.name && s.kelas)

        // Fetch existing student NIS from the DB to skip duplicates
        const existingStudents = await prisma.student.findMany({
            select: { nis: true }
        })
        const existingNisSet = new Set(existingStudents.map(s => s.nis))

        // Filter out students whose NIS already exists in our DB
        const uniqueData = normalizedData.filter(s => !existingNisSet.has(s.nis))

        if (uniqueData.length === 0) {
            return {
                success: true,
                count: 0,
                totalProcessed: normalizedData.length
            }
        }

        // Bulk insert only the unique new records
        const result = await prisma.student.createMany({
            data: uniqueData
        })

        revalidatePath("/dashboard")
        revalidatePath("/record")

        return {
            success: true,
            count: result.count,
            totalProcessed: normalizedData.length
        }
    } catch (error) {
        console.error("Gagal melakukan bulk import siswa:", error)
        return {
            success: false,
            error: "Gagal menyimpan data ke database. Pastikan format file benar."
        }
    }
}

export async function createStudent(data: { nis: string, name: string, kelas: string, jurusan?: string }) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Akses ditolak. Hanya Admin yang dapat menambah data.")
    }

    const nis = data.nis.trim()
    const name = data.name.trim()
    const kelas = data.kelas.trim()
    const jurusan = data.jurusan ? data.jurusan.trim() : null

    if (!nis || !name || !kelas) {
        return { success: false, error: "NIS, Nama, dan Kelas wajib diisi." }
    }

    try {
        const existing = await prisma.student.findUnique({
            where: { nis }
        })
        if (existing) {
            return { success: false, error: `Siswa dengan NIS ${nis} sudah terdaftar.` }
        }

        const newStudent = await prisma.student.create({
            data: { nis, name, kelas, jurusan }
        })

        revalidatePath("/dashboard")
        revalidatePath("/record")

        return { success: true, student: newStudent }
    } catch (error) {
        console.error("Gagal membuat siswa:", error)
        return { success: false, error: "Gagal menyimpan data siswa." }
    }
}

export async function updateStudent(id: string, data: { nis: string, name: string, kelas: string, jurusan?: string }) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Akses ditolak. Hanya Admin yang dapat mengubah data.")
    }

    const nis = data.nis.trim()
    const name = data.name.trim()
    const kelas = data.kelas.trim()
    const jurusan = data.jurusan ? data.jurusan.trim() : null

    if (!nis || !name || !kelas) {
        return { success: false, error: "NIS, Nama, dan Kelas wajib diisi." }
    }

    try {
        // Check if NIS conflicts with another student
        const conflict = await prisma.student.findFirst({
            where: {
                nis,
                NOT: { id }
            }
        })
        if (conflict) {
            return { success: false, error: `NIS ${nis} sudah digunakan oleh siswa lain.` }
        }

        const updated = await prisma.student.update({
            where: { id },
            data: { nis, name, kelas, jurusan }
        })

        revalidatePath("/dashboard")
        revalidatePath("/record")

        return { success: true, student: updated }
    } catch (error) {
        console.error("Gagal memperbarui siswa:", error)
        return { success: false, error: "Gagal memperbarui data siswa." }
    }
}

export async function deleteStudent(id: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Akses ditolak. Hanya Admin yang dapat menghapus data.")
    }

    try {
        await prisma.student.delete({
            where: { id }
        })

        revalidatePath("/dashboard")
        revalidatePath("/record")

        return { success: true }
    } catch (error) {
        console.error("Gagal menghapus siswa:", error)
        return { success: false, error: "Gagal menghapus data siswa." }
    }
}
