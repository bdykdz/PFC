'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react'
import Image from 'next/image'
import { getStorage, ref, getDownloadURL } from 'firebase/storage'

type ContractType = 'CIM' | 'PFA' | 'SRL'

interface User {
  id: string;
  name: string;
  contractType: ContractType;
  email: string;
  phone: string;
  company?: string;
  department?: string;
  expertise?: string;
  generalExperience?: Date | { toDate?: () => Date } | string;
  profileImage?: string;
  observations?: string;
}

interface Contract {
  id: string;
  name: string;
  description?: string;
  location?: string;
  beneficiary?: string;
  position: string;
  startDate: Date | string;
  endDate: Date | string;
  documents: Document[];
}

interface Diploma {
  id: string;
  name: string;
  issuer: string;
  date: Date | string;
  expiryDate?: Date | string;
  documents: Document[];
}

interface Skill {
  id: string;
  name: string;
  level: 'Începător' | 'Intermediar' | 'Expert';
  type: 'Soft' | 'Hard';
}

interface Document {
  id: string;
  name: string;
  fileUrl: string;
}

interface Experience {
  general: number;
  byPosition: Record<string, number>;
}

interface ProfileClientProps {
  userId: string;
  initialUser: User;
  initialContracts: Contract[];
  initialDiplomas: Diploma[];
  initialSkills: Skill[];
  isOwnProfile: boolean;
}

export default function ProfileClient({ 
  userId, 
  initialUser, 
  initialContracts, 
  initialDiplomas, 
  initialSkills,
  isOwnProfile 
}: ProfileClientProps) {
  const router = useRouter()
  const [user] = useState<User>(initialUser)
  const [contracts] = useState<Contract[]>(initialContracts)
  const [diplomas] = useState<Diploma[]>(initialDiplomas)
  const [skills] = useState<Skill[]>(initialSkills)
  const [experience, setExperience] = useState<Experience>({ general: 0, byPosition: {} })
  const [diplomaPage, setDiplomaPage] = useState(1)
  const [contractPage, setContractPage] = useState(1)
  const itemsPerPage = 5

  // Calculate experience whenever contracts or user changes
  useEffect(() => {
    if (!contracts?.length) {
      setExperience({ general: 0, byPosition: {} })
      return
    }

    let generalExp = 0
    try {
      if (user?.generalExperience) {
        const exp = user.generalExperience as any
        const startDate = exp.toDate ? 
          exp.toDate() : 
          new Date(exp)
          
        generalExp = Math.floor(
          (new Date().getTime() - startDate.getTime()) / 
          (1000 * 60 * 60 * 24 * 365)
        )
      }
    } catch (error) {
      console.error('Error calculating general experience:', error)
      generalExp = 0
    }

    const expByPosition: Record<string, number> = {}
    contracts.forEach(contract => {
      const startDate = new Date(contract.startDate)
      const endDate = new Date(contract.endDate)
      const years = (endDate.getTime() - startDate.getTime()) / 
        (1000 * 60 * 60 * 24 * 365)
      
      if (expByPosition[contract.position]) {
        expByPosition[contract.position] += years
      } else {
        expByPosition[contract.position] = years
      }
    })

    setExperience({
      general: Math.max(0, generalExp),
      byPosition: expByPosition
    })
  }, [contracts, user?.generalExperience])

  const calculateContractDuration = (startDate: Date | string, endDate: Date | string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMilliseconds = end.getTime() - start.getTime();
    const years = diffInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
    return years.toFixed(1);
  }

  const handleDownload = async (fileUrl: string) => {
    try {
      if (fileUrl.startsWith('https://firebasestorage.googleapis.com')) {
        window.open(fileUrl, '_blank')
        return
      }
  
      const storage = getStorage()
      const storageRef = ref(storage, fileUrl)
      const downloadUrl = await getDownloadURL(storageRef)
      window.open(downloadUrl, '_blank')
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-6">
            <div>
              <Image 
                src={user.profileImage || "/profile.svg"} 
                alt={user.name}
                width={150}
                height={40}
                className="rounded-full"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <Badge>{user.contractType}</Badge>
              </div>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-muted-foreground">{user.phone}</p>
              <div>
                <p className="font-semibold text-foreground">Company</p>
                <p className="text-muted-foreground">{user.company}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Department</p>
                <p className="text-muted-foreground">{user.department}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground">Expertise</p>
              <p className="text-muted-foreground">{user.expertise}</p>
            </div>
            {isOwnProfile && (
              <Button
                variant="outline"
                onClick={() => router.push(`/edit-profile/${userId}`)}
                className="h-10"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Experience Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/20 dark:from-orange-500/20 dark:to-orange-500/10">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">General Experience</p>
            <p className="text-xl font-bold">{experience.general} Years</p>
          </CardContent>
        </Card>
        {Object.entries(experience.byPosition).map(([position, years], index) => (
          <Card 
            key={`exp-${position}-${index}`}
            className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/10"
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{position}</p>
              <p className="text-xl font-bold">{years.toFixed(1)} Years</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diplomas */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Diplomas</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDiplomaPage(prev => Math.max(prev - 1, 1))}
              disabled={diplomaPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {diplomaPage} of {Math.ceil(diplomas.length / itemsPerPage)}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDiplomaPage(prev => 
                Math.min(prev + 1, Math.ceil(diplomas.length / itemsPerPage))
              )}
              disabled={diplomaPage === Math.ceil(diplomas.length / itemsPerPage)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground">
                <th className="pb-2">Name</th>
                <th className="pb-2">Issuer</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {diplomas
                .slice((diplomaPage - 1) * itemsPerPage, diplomaPage * itemsPerPage)
                .map(diploma => (
                  <tr key={`diploma-${diploma.id}`} className="border-t">
                    <td className="py-2">{diploma.name}</td>
                    <td className="py-2">{diploma.issuer}</td>
                    <td className="py-2">{new Date(diploma.date).toLocaleDateString()}</td>
                    <td className="py-2">
                      {diploma.documents?.map(doc => (
                        <Button
                          key={`diploma-doc-${doc.id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc.fileUrl)}
                        >
                          Download
                        </Button>
                      ))}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Contracts */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Contracts</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setContractPage(prev => Math.max(prev - 1, 1))}
              disabled={contractPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {contractPage} of {Math.ceil(contracts.length / itemsPerPage)}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setContractPage(prev => 
                Math.min(prev + 1, Math.ceil(contracts.length / itemsPerPage))
              )}
              disabled={contractPage === Math.ceil(contracts.length / itemsPerPage)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground">
                <th className="pb-2">Name</th>
                <th className="pb-2">Position</th>
                <th className="pb-2">Period</th>
                <th className="pb-2">Location</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts
                .slice((contractPage - 1) * itemsPerPage, contractPage * itemsPerPage)
                .map(contract => (
                  <tr key={`contract-${contract.id}`} className="border-t">
                    <td className="py-2">{contract.name}</td>
                    <td className="py-2">{contract.position}</td>
                    <td className="py-2">
                      {new Date(contract.startDate).toLocaleDateString()} - 
                      {new Date(contract.endDate).toLocaleDateString()}
                      <div className="text-sm text-muted-foreground">
                        ({calculateContractDuration(contract.startDate, contract.endDate)} years)
                      </div>
                    </td>
                    <td className="py-2">{contract.location}</td>
                    <td className="py-2">
                      {contract.documents?.map(doc => (
                        <Button
                          key={`contract-doc-${doc.id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc.fileUrl)}
                        >
                          Download
                        </Button>
                      ))}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Skills */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Soft Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Soft Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skills
              .filter(skill => skill.type === 'Soft')
              .map((skill, index) => (
                <Badge
                  key={`soft-skill-${skill.id}-${index}`}
                  variant="outline"
                  className={`
                    ${skill.level === 'Expert' ? 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300' :
                      skill.level === 'Intermediar' ? 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300' :
                      'bg-destructive/10 text-destructive-foreground dark:bg-destructive/20 dark:text-destructive-foreground'}
                  `}
                >
                  {skill.name}
                </Badge>
              ))}
          </CardContent>
        </Card>

        {/* Hard Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Hard Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skills
              .filter(skill => skill.type === 'Hard')
              .map((skill, index) => (
                <Badge
                  key={`hard-skill-${skill.id}-${index}`}
                  variant="outline"
                  className={`
                    ${skill.level === 'Expert' ? 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300' :
                      skill.level === 'Intermediar' ? 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300' :
                      'bg-destructive/10 text-destructive-foreground dark:bg-destructive/20 dark:text-destructive-foreground'}
                  `}
                >
                  {skill.name}
                </Badge>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Observations */}
      {user.observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              {user.observations.split('\n').map((observation, index) => (
                <li key={`observation-${index}-${observation.substring(0, 10)}`}>
                  {observation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}