import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "public", "Template_Import_Siswa_HKTI2.xlsx")
        
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "File template tidak ditemukan" }, { status: 404 })
        }
        
        // Read file as buffer
        const fileBuffer = fs.readFileSync(filePath)
        
        // Return file response with explicit attachment headers
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="Template_Import_Siswa_HKTI2.xlsx"',
            }
        })
    } catch (error) {
        console.error("Gagal mendownload template:", error)
        return NextResponse.json({ error: "Gagal memproses unduhan template" }, { status: 500 })
    }
}
