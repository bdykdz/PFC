const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function createAdmin() {
  console.log('\n🔧 Create First Admin User\n')
  
  try {
    // Get user details
    const email = await question('Enter admin email address: ')
    const name = await question('Enter admin full name: ')
    const azureId = await question('Enter Azure AD Object ID (optional, press Enter to skip): ')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log('\n⚠️  User already exists with this email!')
      const update = await question('Do you want to update them to admin? (yes/no): ')
      
      if (update.toLowerCase() === 'yes') {
        await prisma.user.update({
          where: { email },
          data: { 
            role: 'admin',
            azure_id: azureId || existingUser.azure_id
          }
        })
        console.log('\n✅ User updated to admin successfully!')
      } else {
        console.log('\n❌ Operation cancelled')
      }
    } else {
      // Create new admin user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'admin',
          azure_id: azureId || null
        }
      })
      
      console.log('\n✅ Admin user created successfully!')
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   ID: ${user.id}`)
    }
    
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

// Run the script
createAdmin()