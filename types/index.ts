export interface User {
  id: string
  email: string
  name: string
  azure_id?: string | null
  contract_type?: string | null
  profile_image_url?: string | null
  role: string
  created_at: Date
  updated_at: Date
}

export interface Contract {
  id: string
  user_id: string
  contract_number?: string | null
  start_date: Date
  end_date?: Date | null
  document_url?: string | null
  created_at: Date
  updated_at: Date
}

export interface Diploma {
  id: string
  user_id: string
  title: string
  institution?: string | null
  issue_date?: Date | null
  document_url?: string | null
  created_at: Date
  updated_at: Date
}

export interface Skill {
  id: string
  name: string
  category?: string | null
  created_at: Date
}

export interface UserSkill {
  user_id: string
  skill_id: string
  proficiency_level?: number | null
  years_experience?: number | null
  created_at: Date
}

export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete'
}