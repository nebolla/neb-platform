import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const p = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Admin#123!', 12)

  // Super Admin बनाएँ
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

  // Pool accounts बनाएँ
  for (const name of ['VIP', 'ELITE', 'WITHDRAWAL_FEE']) {
    await p.poolAccount.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  console.log('✅ Seed complete: Super Admin + Pools created')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
