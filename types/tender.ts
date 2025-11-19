// Tender-specific types

export interface Language {
  language: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native'
}

export interface ProjectCategory {
  id: string
  name: string
  description?: string
}

export interface Certification {
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  certificateNumber?: string
}

export interface TenderEmployee {
  id: string
  name: string
  email: string
  department?: string
  expertise?: string
  yearsExperience?: number
  projectCategories?: string[]
  securityClearance?: string
  availabilityStatus?: string
  hourlyRate?: number
  languages?: Language[]
  isKeyExpert: boolean
  location?: string
  certifications?: Certification[]
  skills: Array<{
    name: string
    level: string
    type: string
  }>
}

export interface TenderProjectMember {
  id: string
  employee: TenderEmployee
  role: string
  responsibility?: string
  allocation?: number
  cost?: number
}

export interface TenderTeam {
  id: string
  name: string
  description?: string
  members: TenderProjectMember[]
  totalCost?: number
}

export interface TenderProject {
  id: string
  name: string
  description?: string
  client?: string
  projectCategory?: string
  submissionDate?: Date
  status: 'Draft' | 'In Progress' | 'Submitted' | 'Won' | 'Lost'
  estimatedValue?: number
  requirements?: any
  teams: TenderTeam[]
  totalProjectCost?: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface TenderSearchFilters {
  projectCategories?: string[]
  securityClearance?: string[]
  availabilityStatus?: string[]
  yearsExperience?: {
    min?: number
    max?: number
  }
  hourlyRate?: {
    min?: number
    max?: number
  }
  languages?: string[]
  isKeyExpert?: boolean
  location?: string[]
  skills?: string[]
  departments?: string[]
}

export interface CapabilityReport {
  totalEmployees: number
  availableEmployees: number
  keyExperts: number
  categoryBreakdown: Array<{
    category: string
    count: number
    percentage: number
  }>
  experienceBreakdown: Array<{
    range: string
    count: number
    percentage: number
  }>
  averageRate: number
  topSkills: Array<{
    skill: string
    expertCount: number
    totalCount: number
  }>
  securityClearanceBreakdown: Array<{
    level: string
    count: number
    percentage: number
  }>
}

// Default project categories for tendering
export const DEFAULT_PROJECT_CATEGORIES = [
  'Infrastructure',
  'IT & Software',
  'Construction',
  'Water & Utilities',
  'Transportation',
  'Energy',
  'Healthcare',
  'Education',
  'Defense',
  'Environmental',
  'Telecommunications',
  'Consulting'
] as const

export const SECURITY_CLEARANCE_LEVELS = [
  'Public',
  'Confidential', 
  'Secret',
  'Top Secret'
] as const

export const AVAILABILITY_STATUS = [
  'Available',
  'Assigned',
  'On Leave',
  'Unavailable'
] as const

export const LANGUAGE_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Native'
] as const