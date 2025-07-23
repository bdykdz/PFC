import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import EditProfileClient from './edit-profile-client'

export const dynamic = 'force-dynamic'

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Check if user can edit this profile
  // Only admins and managers can edit employee profiles
  const canEdit = session.user.role === 'admin' || session.user.role === 'manager'
  
  if (!canEdit) {
    redirect(`/profile/${id}`)
  }

  try {
    // Fetch employee data with related data
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            documents: true
          },
          orderBy: {
            start_date: 'desc'
          }
        },
        diplomas: {
          include: {
            documents: true
          },
          orderBy: {
            issue_date: 'desc'
          }
        },
        skills: {
          orderBy: [
            { type: 'asc' },
            { name: 'asc' }
          ]
        }
      }
    })
    
    if (!employee) {
      notFound()
    }

    // Transform data for client component
    const userData = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      contractType: employee.contract_type,
      company: employee.company,
      department: employee.department,
      expertise: employee.expertise,
      generalExperience: employee.general_experience,
      observations: employee.observations,
      profileImageUrl: employee.profile_image_url,
      role: '', // Employees don't have roles
    }

    const contracts = employee.contracts.map(contract => ({
      id: contract.id,
      name: contract.name,
      description: contract.description,
      location: contract.location,
      beneficiary: contract.beneficiary,
      position: contract.position,
      contractNumber: contract.contract_number,
      startDate: contract.start_date,
      endDate: contract.end_date,
      documents: contract.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        fileUrl: doc.file_url,
        uploadedAt: doc.uploaded_at
      }))
    }))

    const diplomas = employee.diplomas.map(diploma => ({
      id: diploma.id,
      name: diploma.name,
      issuer: diploma.issuer,
      issueDate: diploma.issue_date,
      expiryDate: diploma.expiry_date,
      documents: diploma.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        fileUrl: doc.file_url,
        uploadedAt: doc.uploaded_at
      }))
    }))

    const skills = employee.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      level: skill.level as 'beginner' | 'intermediate' | 'expert',
      type: skill.type as 'soft' | 'hard'
    }))

    return (
      <EditProfileClient
        userId={id}
        initialUser={userData}
        initialContracts={contracts}
        initialDiplomas={diplomas}
        initialSkills={skills}
      />
    )
  } catch (error) {
    console.error('Error fetching profile:', error)
    notFound()
  }
}