import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RecordClient } from "@/components/record/RecordClient"

export default async function RecordPage() {
    const session = await auth()

    // 1. Calculate time boundaries for Today's lates
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // 2. Fetch data in parallel
    const [tardiesToday, allTardiesForClassGrouping, studentsList] = await Promise.all([
        prisma.tardiness.count({
            where: {
                date: {
                    gte: todayStart,
                    lte: todayEnd
                }
            }
        }),
        prisma.tardiness.findMany({
            select: {
                student: {
                    select: {
                        kelas: true
                    }
                }
            }
        }),
        prisma.student.findMany({
            select: {
                id: true,
                nis: true,
                name: true,
                kelas: true,
                jurusan: true,
                tardies: {
                    select: {
                        id: true,
                        date: true,
                        reason: true
                    },
                    orderBy: {
                        date: 'desc'
                    }
                }
            },
            orderBy: [
                { kelas: 'asc' },
                { name: 'asc' }
            ]
        })
    ])

    // Find class with the most lates
    const classCounts: Record<string, number> = {}
    allTardiesForClassGrouping.forEach(item => {
        const cls = item.student?.kelas
        if (cls) {
            classCounts[cls] = (classCounts[cls] || 0) + 1
        }
    })

    let topClass = "Belum ada data"
    let topCount = 0
    Object.entries(classCounts).forEach(([cls, count]) => {
        if (count > topCount) {
            topCount = count
            topClass = `${cls} (${count}x)`
        }
    })

    const stats = {
        tardiesToday,
        topClass
    }

    // Format list of students to match Client interface requirements
    const formattedStudents = studentsList.map(s => ({
        id: s.id,
        nis: s.nis,
        name: s.name,
        kelas: s.kelas,
        jurusan: s.jurusan || "",
        tardies: s.tardies,
        tardiesCount: s.tardies.length
    }))

    return (
        <RecordClient 
            initialStudents={formattedStudents}
            stats={stats}
            currentUser={session?.user || null}
        />
    )
}
