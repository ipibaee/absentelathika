const XLSX = require("xlsx")

const data = [
    {
        "nis": "10001",
        "nama": "Budi Santoso",
        "kelas": "X PPLG 1",
        "jurusan": "PPLG"
    },
    {
        "nis": "10002",
        "nama": "Aditya Pratama",
        "kelas": "X PPLG 2",
        "jurusan": "PPLG"
    },
    {
        "nis": "10003",
        "nama": "Siti Rahmawati",
        "kelas": "XI AKL 1",
        "jurusan": "AKL"
    }
]

const worksheet = XLSX.utils.json_to_sheet(data)
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, worksheet, "Template Siswa")

// Set column widths
worksheet["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }]

XLSX.writeFile(workbook, "public/Template_Import_Siswa_HKTI2.xlsx")
console.log("Template generated successfully.")
