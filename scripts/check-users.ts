import { prisma } from '../lib/prisma'

async function main() {
  const userCount = await prisma.user.count()
  const employeeCount = await prisma.employee.count()
  
  console.log(`Users in database: ${userCount}`)
  console.log(`Employees in database: ${employeeCount}`)
  
  if (userCount === 0) {
    console.log('\n⚠️  No users found in database!')
    console.log('Please visit http://localhost:3010/setup to import users from Azure AD')
  }
  
  process.exit(0)
}

main().catch(console.error)