import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard/DashboardClient"

export default async function DashboardPage() {
    const session = await auth()
    
    // Route protection redundancy check
    if (!session || session.user.role !== "ADMIN") {
        redirect("/record")
    }

    // 1. Calculate time boundaries for Today's lates
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // 2. Calculate time boundaries for Weekly lates (from Monday)
    const weekStart = new Date()
    const currentDay = weekStart.getDay()
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1 // 0 is Sunday, 1 is Monday
    weekStart.setDate(weekStart.getDate() - daysToSubtract)
    weekStart.setHours(0, 0, 0, 0)

    // Execute queries in parallel
    const [tardiesToday, tardiesThisWeek, totalStudents, allTardiesForClassGrouping, studentsList] = await Promise.all([
        prisma.tardiness.count({
            where: {
                date: {
                    gte: todayStart,
                    lte: todayEnd
                }
            }
        }),
        prisma.tardiness.count({
            where: {
                date: {
                    gte: weekStart
                }
            }
        }),
        prisma.student.count(),
        // Get all tardies to group by student class
        prisma.tardiness.findMany({
            select: {
                student: {
                    select: {
                        kelas: true
                    }
                }
            }
        }),
        // Get all students with their tardiness records
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
        tardiesThisWeek,
        totalStudents,
        topClass
    }

    return (
        <DashboardClient 
            students={studentsList} 
            stats={stats} 
        />
    )
}
