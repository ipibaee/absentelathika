const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Clean up database
  await prisma.tardiness.deleteMany({})
  await prisma.student.deleteMany({})
  await prisma.user.deleteMany({})

  // Seed default users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const piketPassword = await bcrypt.hash('piket123', 10)

  await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  await prisma.user.create({
    data: {
      username: 'piket',
      password: piketPassword,
      role: 'PIKET',
    },
  })

  // Create a few dummy students for testing out-of-the-box live search and recording
  await prisma.student.createMany({
    data: [
      { nis: '10001', name: 'Budi Santoso', kelas: 'X PPLG 1', jurusan: 'PPLG' },
      { nis: '10002', name: 'Aditya Pratama', kelas: 'X PPLG 2', jurusan: 'PPLG' },
      { nis: '10003', name: 'Siti Rahmawati', kelas: 'XI AKL 1', jurusan: 'AKL' },
      { nis: '10004', name: 'Dewi Lestari', kelas: 'XI AKL 2', jurusan: 'AKL' },
      { nis: '10005', name: 'Rian Hidayat', kelas: 'XII TO 1', jurusan: 'TO' },
      { nis: '10006', name: 'Muhammad Yusuf', kelas: 'XII TO 2', jurusan: 'TO' },
    ]
  })

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
