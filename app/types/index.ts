export interface Document {
  name: string
  fileUrl: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  azureId?: string
  contractType?: 'CIM' | 'PFA' | 'SRL'
  company?: string
  department?: string
  expertise?: string
  generalExperience?: Date
  observations?: string
  profileImageUrl?: string
  role: 'viewer' | 'editor' | 'manager' | 'admin'
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface Contract {
  id: string
  userId: string
  name: string
  description?: string
  location?: string
  beneficiary?: string
  position?: string
  contractNumber?: string
  startDate: Date
  endDate?: Date
  documents?: ContractDocument[]
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface ContractDocument {
  id: string
  contractId: string
  name: string
  fileUrl: string
  uploadedAt: Date
}

export interface Diploma {
  id: string
  userId: string
  name: string
  issuer: string
  issueDate: Date
  expiryDate?: Date
  documents?: DiplomaDocument[]
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface DiplomaDocument {
  id: string
  diplomaId: string
  name: string
  fileUrl: string
  uploadedAt: Date
}

export interface Skill {
  id: string
  userId: string
  name: string
  level: 'Începător' | 'Intermediar' | 'Expert'
  type: 'Soft' | 'Hard'
  createdAt: Date
  updatedAt: Date
}