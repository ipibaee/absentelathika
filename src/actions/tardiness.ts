"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function recordTardiness(studentId: string, reason?: string) {
    try {
        const newTardiness = await prisma.tardiness.create({
            data: {
                studentId,
                reason: reason || "Tanpa alasan",
            },
            include: {
                student: {
                    select: {
                        name: true,
                        nis: true,
                        kelas: true
                    }
                }
            }
        })

        // Revalidate cache paths to sync dashboards
        revalidatePath("/dashboard")
        revalidatePath("/record")

        return {
            success: true,
            tardiness: {
                id: newTardiness.id,
                date: newTardiness.date,
                reason: newTardiness.reason,
                studentId: newTardiness.studentId,
                studentName: newTardiness.student.name,
                studentNis: newTardiness.student.nis,
                studentKelas: newTardiness.student.kelas,
            }
        }
    } catch (error) {
        console.error("Gagal mencatat keterlambatan:", error)
        return {
            success: false,
            error: "Gagal menyimpan ke database."
        }
    }
}

export async function deleteTardiness(id: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Akses ditolak. Hanya Admin yang dapat menghapus data rekap.")
    }

    try {
        await prisma.tardiness.delete({
            where: { id }
        })

        revalidatePath("/dashboard")
        revalidatePath("/record")

        return { success: true }
    } catch (error) {
        console.error("Gagal menghapus rekap keterlambatan:", error)
        return { success: false, error: "Gagal menghapus data keterlambatan." }
    }
}

export async function updateTardinessReason(id: string, reason: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Akses ditolak. Hanya Admin yang dapat memperbarui data rekap.")
    }

    try {
        await prisma.tardiness.update({
            where: { id },
            data: {
                reason: reason || "Tanpa alasan"
            }
        })

        revalidatePath("/dashboard")
        revalidatePath("/record")

        return { success: true }
    } catch (error) {
        console.error("Gagal memperbarui rekap keterlambatan:", error)
        return { success: false, error: "Gagal memperbarui data keterlambatan." }
    }
}
