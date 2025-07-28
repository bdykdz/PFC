'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Edit, Download, Calendar, MapPin, Building2, User, Phone, Mail, Briefcase, GraduationCap, Brain, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n/context'

interface User {
  id: string;
  name: string;
  contractType?: string | null;
  email: string;
  phone?: string | null;
  company?: string | null;
  department?: string | null;
  expertise?: string | null;
  generalExperience?: Date | null;
  profileImageUrl?: string | null;
  observations?: string | null;
  role: string;
}

interface Contract {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  beneficiary?: string | null;
  position?: string | null;
  contractNumber?: string | null;
  startDate: Date;
  endDate?: Date | null;
  documents: Document[];
}

interface Diploma {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date | null;
  documents: Document[];
}

interface Skill {
  id: string;
  name: string;
  level: string;
  type: string;
}

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  uploadedAt: Date;
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
  initialDocuments?: Document[];
  canEdit: boolean;
  isOwnProfile: boolean;
  isEmployeeProfile?: boolean;
}

export default function ProfileClient({ 
  userId, 
  initialUser, 
  initialContracts, 
  initialDiplomas, 
  initialSkills,
  initialDocuments = [],
  canEdit,
  isOwnProfile,
  isEmployeeProfile = false 
}: ProfileClientProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [user] = useState<User>(initialUser)
  const [contracts] = useState<Contract[]>(initialContracts)
  const [diplomas] = useState<Diploma[]>(initialDiplomas)
  const [skills] = useState<Skill[]>(initialSkills)
  const [documents] = useState<Document[]>(initialDocuments)
  const [experience, setExperience] = useState<Experience>({ general: 0, byPosition: {} })
  const [diplomaPage, setDiplomaPage] = useState(1)
  const [contractPage, setContractPage] = useState(1)
  const itemsPerPage = 5

  // Group skills by type
  const softSkills = skills.filter(skill => skill.type === 'Soft')
  const hardSkills = skills.filter(skill => skill.type === 'Hard')

  // Calculate experience whenever contracts or user changes
  useEffect(() => {
    let generalExp = 0
    try {
      if (user?.generalExperience) {
        const startDate = new Date(user.generalExperience)
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
      if (contract.position) {
        const startDate = new Date(contract.startDate)
        const endDate = contract.endDate ? new Date(contract.endDate) : new Date()
        const years = (endDate.getTime() - startDate.getTime()) / 
          (1000 * 60 * 60 * 24 * 365)
        
        if (expByPosition[contract.position]) {
          expByPosition[contract.position] += years
        } else {
          expByPosition[contract.position] = years
        }
      }
    })

    setExperience({
      general: Math.max(0, generalExp),
      byPosition: expByPosition
    })
  }, [contracts, user?.generalExperience])

  const calculateContractDuration = (startDate: Date, endDate?: Date | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffInMilliseconds = end.getTime() - start.getTime();
    const years = diffInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
    return years.toFixed(1);
  }

  const handleDownload = async (fileUrl: string) => {
    try {
      // Use direct download endpoint
      window.open(`/api/documents/${fileUrl}`, '_blank')
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getSkillColor = (level: string) => {
    const expertLevel = t('skills.expert')
    const intermediateLevel = t('skills.intermediate')
    const beginnerLevel = t('skills.beginner')
    
    switch (level) {
      case 'Expert':
      case expertLevel:
        return 'bg-green-500'
      case 'Intermediar':
      case intermediateLevel:
        return 'bg-yellow-500'
      case 'Începător':
      case beginnerLevel:
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.name} />
                <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    {user.contractType && (
                      <Badge variant="secondary" className="text-sm">
                        {user.contractType}
                      </Badge>
                    )}
                    {user.role === 'admin' && (
                      <Badge variant="default" className="text-sm">
                        {t('profile.admin')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${user.email}`} className="hover:underline">
                        {user.email}
                      </a>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${user.phone}`} className="hover:underline">
                          {user.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/edit-profile/${userId}`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {t('profile.editProfile')}
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.company && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.company')}</p>
                    <p className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {user.company}
                    </p>
                  </div>
                )}
                {user.department && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.department')}</p>
                    <p>{user.department}</p>
                  </div>
                )}
                {user.expertise && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.expertise')}</p>
                    <p className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      {user.expertise}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/20 dark:from-orange-500/20 dark:to-orange-500/10">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{t('profile.generalExperience')}</p>
            <p className="text-2xl font-bold">{experience.general} {t('profile.years')}</p>
          </CardContent>
        </Card>
        {Object.entries(experience.byPosition).slice(0, 3).map(([position, years]) => (
          <Card 
            key={position}
            className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/10"
          >
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{position}</p>
              <p className="text-2xl font-bold">{years.toFixed(1)} {t('profile.years')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diplomas */}
      {diplomas.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {t('profile.diplomas')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDiplomaPage(prev => Math.max(prev - 1, 1))}
                  disabled={diplomaPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('profile.page')} {diplomaPage} {t('profile.of')} {Math.ceil(diplomas.length / itemsPerPage)}
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">{t('profile.name')}</th>
                    <th className="pb-3 font-medium">{t('profile.issuer')}</th>
                    <th className="pb-3 font-medium">{t('profile.issueDate')}</th>
                    <th className="pb-3 font-medium">{t('profile.expiryDate')}</th>
                    <th className="pb-3 font-medium">{t('profile.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {diplomas
                    .slice((diplomaPage - 1) * itemsPerPage, diplomaPage * itemsPerPage)
                    .map(diploma => (
                      <tr key={diploma.id} className="border-b">
                        <td className="py-3">{diploma.name}</td>
                        <td className="py-3">{diploma.issuer}</td>
                        <td className="py-3">{format(new Date(diploma.issueDate), 'dd/MM/yyyy')}</td>
                        <td className="py-3">
                          {diploma.expiryDate ? format(new Date(diploma.expiryDate), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="py-3">
                          {diploma.documents?.map(doc => (
                            <Button
                              key={doc.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.fileUrl)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracts */}
      {contracts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {t('profile.contracts')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setContractPage(prev => Math.max(prev - 1, 1))}
                  disabled={contractPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('profile.page')} {contractPage} {t('profile.of')} {Math.ceil(contracts.length / itemsPerPage)}
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">{t('profile.name')}</th>
                    <th className="pb-3 font-medium">{t('profile.position')}</th>
                    <th className="pb-3 font-medium">{t('profile.period')}</th>
                    <th className="pb-3 font-medium">{t('profile.location')}</th>
                    <th className="pb-3 font-medium">{t('profile.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts
                    .slice((contractPage - 1) * itemsPerPage, contractPage * itemsPerPage)
                    .map(contract => (
                      <tr key={contract.id} className="border-b">
                        <td className="py-3">{contract.name}</td>
                        <td className="py-3">{contract.position || '-'}</td>
                        <td className="py-3">
                          <div>
                            {format(new Date(contract.startDate), 'dd/MM/yyyy')} - 
                            {contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : t('profile.present')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ({calculateContractDuration(contract.startDate, contract.endDate)} {t('profile.years')})
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {contract.location || '-'}
                          </div>
                        </td>
                        <td className="py-3">
                          {contract.documents?.map(doc => (
                            <Button
                              key={doc.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.fileUrl)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Soft Skills */}
        {softSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.softSkills')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {softSkills.map(skill => (
                  <div key={skill.id} className="flex items-center justify-between">
                    <span>{skill.name}</span>
                    <Badge className={`${getSkillColor(skill.level)} text-white`}>
                      {skill.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hard Skills */}
        {hardSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.hardSkills')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {hardSkills.map(skill => (
                  <div key={skill.id} className="flex items-center justify-between">
                    <span>{skill.name}</span>
                    <Badge className={`${getSkillColor(skill.level)} text-white`}>
                      {skill.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Observations */}
      {user.observations && (
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.observations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{user.observations}</p>
          </CardContent>
        </Card>
      )}

      {/* General Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.documents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{doc.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({format(new Date(doc.uploadedAt), 'dd/MM/yyyy')})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.fileUrl)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}