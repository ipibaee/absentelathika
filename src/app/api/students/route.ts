import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                nis: true,
                name: true,
                kelas: true,
                jurusan: true,
                _count: {
                    select: { tardies: true }
                }
            },
            orderBy: [
                { kelas: 'asc' },
                { name: 'asc' }
            ]
        })

        // Format slightly to simplify client reading
        const formattedStudents = students.map(s => ({
            id: s.id,
            nis: s.nis,
            name: s.name,
            kelas: s.kelas,
            jurusan: s.jurusan || "",
            tardiesCount: s._count.tardies
        }))

        return NextResponse.json(formattedStudents)
    } catch (error) {
        console.error("Error fetching students list:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
