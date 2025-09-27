import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const p = new PrismaClient()

const main = async () => {
  const hash = await bcrypt.hash('Admin#123!', 12)

  await p.user.upsert({
    where: { email: 'admin@nebolla.space' },
    update: {},
    create: {
      email: 'admin@nebolla.space',
      name: 'Super Admin',
      partnerId: 'NEB-ADMIN',
      referralCode: 'admin',
      role: 'SUPER_ADMIN',
      passwordHash: hash
    }
  })

  for (const name of ['VIP', 'ELITE', 'WITHDRAWAL_FEE']) {
    await p.poolAccount.upsert({ where: { name }, update: {}, create: { name } })
  }

  console.log('✅ Seed complete: Super Admin + Pools created')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
