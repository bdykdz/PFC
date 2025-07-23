import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/firebase-admin'
import { validateSession } from '@/lib/session-validation'
import ProfileClient from './profile-client'
import { User as UserType, Contract, Diploma, Skill } from '@/types'
import { serializeData } from '@/lib/serialize-data'

type User = UserType & { id: string }

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Validate session and get user
  const sessionUser = await validateSession()
  
  if (!sessionUser) {
    redirect('/login')
  }

  try {
    // Fetch user data from Firestore Admin
    const userDoc = await db.collection('users').doc(id).get()
    
    if (!userDoc.exists) {
      notFound()
    }

    const userData = userDoc.data()
    
    // For now, allow any authenticated user to view profiles
    // In production, you might want to add role-based access control here
    // For example: check if sessionUser.uid === params.id for own profile
    // or check if sessionUser has admin role or is in same organization
    
    // Fetch related data
    const [contractsSnapshot, diplomasSnapshot, skillsSnapshot] = await Promise.all([
      db.collection('contracts').where('userId', '==', id).get(),
      db.collection('diplomas').where('userId', '==', id).get(),
      db.collection('skills').where('userId', '==', id).get()
    ])

    // Serialize all data to ensure it's safe for client components
    const contracts = contractsSnapshot.docs.map(doc => 
      serializeData({ id: doc.id, ...doc.data() })
    )

    const diplomas = diplomasSnapshot.docs.map(doc => 
      serializeData({ id: doc.id, ...doc.data() })
    )

    const skills = skillsSnapshot.docs.map(doc => 
      serializeData({ id: doc.id, ...doc.data() })
    )

    // Serialize user data
    const user = serializeData({
      id: userDoc.id,
      ...userData
    })

    // Pass data to client component
    return (
      <ProfileClient
        userId={id}
        initialUser={user as User}
        initialContracts={contracts as any}
        initialDiplomas={diplomas as any}
        initialSkills={skills as any}
        isOwnProfile={sessionUser.uid === id}
      />
    )
  } catch (error) {
    console.error('Error fetching profile:', error)
    notFound()
  }
}