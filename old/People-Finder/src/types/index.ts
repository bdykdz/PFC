// src/types/index.ts
import { Timestamp } from 'firebase/firestore'

export interface Document {
  name: string
  fileUrl: string
}

export interface User {
  name: string
  email: string
  phone: string
  contractType: 'CIM' | 'PFA' | 'SRL'
  company: string
  department: string
  expertise: string
  generalExperience: Timestamp
  observations: string
  role?: 'admin' | 'user'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Contract {
  name: string
  description: string
  location: string
  beneficiary: string
  position: string
  startDate: Timestamp
  endDate: Timestamp
  documents: Document[]
  userId?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Diploma {
  name: string
  issuer: string
  date: Timestamp
  documents: Document[]
  userId?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Skill {
  name: string
  level: 'Începător' | 'Intermediar' | 'Expert'
  type: 'Soft' | 'Hard'
  userId?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}