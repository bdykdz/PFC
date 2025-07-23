const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configuration - EDIT THESE VALUES
const ADMIN_CONFIG = {
  email: 'admin@yourcompany.com',     // Change this to your email
  name: 'Admin User',                  // Change this to your name
  azureId: '',                         // Optional: Your Azure AD Object ID
  contractType: null,                  // Optional: 'CIM', 'PFA', 'SRL', or null
}

async function createAdmin() {
  console.log('\n🔧 Creating Admin User...\n')
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_CONFIG.email }
    })
    
    if (existingUser) {
      console.log('⚠️  User already exists, updating to admin...')
      
      const updated = await prisma.user.update({
        where: { email: ADMIN_CONFIG.email },
        data: { 
          role: 'admin',
          name: ADMIN_CONFIG.name,
          azure_id: ADMIN_CONFIG.azureId || existingUser.azure_id,
          contract_type: ADMIN_CONFIG.contractType || existingUser.contract_type
        }
      })
      
      console.log('✅ User updated to admin successfully!')
      console.log(`   Email: ${updated.email}`)
      console.log(`   Name: ${updated.name}`)
      console.log(`   Role: ${updated.role}`)
      
    } else {
      // Create new admin user
      const user = await prisma.user.create({
        data: {
          email: ADMIN_CONFIG.email,
          name: ADMIN_CONFIG.name,
          role: 'admin',
          azure_id: ADMIN_CONFIG.azureId || null,
          contract_type: ADMIN_CONFIG.contractType
        }
      })
      
      console.log('✅ Admin user created successfully!')
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   ID: ${user.id}`)
    }
    
    console.log('\n📝 Next steps:')
    console.log('   1. Start the application: npm run dev')
    console.log('   2. Go to http://localhost:3000')
    console.log('   3. Sign in with Microsoft using the email above')
    console.log('   4. You will have admin access!')
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
    if (error.code === 'P2002') {
      console.error('   Email already exists in the database')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createAdmin()