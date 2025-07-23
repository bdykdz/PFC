import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import ProfileClient from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return notFound()
  }

  try {
    // Try to find employee first
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
        },
        documents: {
          orderBy: {
            uploaded_at: 'desc'
          }
        }
      }
    })
    
    if (employee) {
      // This is an employee profile
      const canEdit = ['admin', 'manager', 'editor'].includes(session.user.role)

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
        role: 'employee', // Mark as employee profile
        createdAt: employee.created_at,
        updatedAt: employee.updated_at
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
        level: skill.level,
        type: skill.type
      }))

      const documents = employee.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        fileUrl: doc.file_url,
        uploadedAt: doc.uploaded_at
      }))

      return (
        <ProfileClient
          userId={id}
          initialUser={userData}
          initialContracts={contracts}
          initialDiplomas={diplomas}
          initialSkills={skills}
          initialDocuments={documents}
          canEdit={canEdit}
          isOwnProfile={false}
          isEmployeeProfile={true}
        />
      )
    }

    // If not an employee, try to find a user
    const user = await prisma.user.findUnique({
      where: { id },
    })
    
    if (!user) {
      notFound()
    }

    const isOwnProfile = session.user.id === id
    const canEdit = isOwnProfile || session.user.role === 'admin'

    // Transform data for client component
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: null,
      contractType: null,
      company: null,
      department: null,
      expertise: null,
      generalExperience: null,
      observations: null,
      profileImageUrl: null,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }

    return (
      <ProfileClient
        userId={id}
        initialUser={userData}
        initialContracts={[]}
        initialDiplomas={[]}
        initialSkills={[]}
        initialDocuments={[]}
        canEdit={canEdit}
        isOwnProfile={isOwnProfile}
        isEmployeeProfile={false}
      />
    )
  } catch (error) {
    console.error('Error fetching profile:', error)
    notFound()
  }
}