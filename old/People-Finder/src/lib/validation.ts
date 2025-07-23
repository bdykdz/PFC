import { User, Diploma, Skill } from '@/types'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone validation regex (Romanian format)
const PHONE_REGEX = /^(\+4|0)[0-9]{9,10}$/

// Sanitize string input
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

// Sanitize and validate email
export function validateEmail(email: string): { isValid: boolean; sanitized: string } {
  const sanitized = email.trim().toLowerCase()
  return {
    isValid: EMAIL_REGEX.test(sanitized),
    sanitized
  }
}

// Sanitize and validate phone
export function validatePhone(phone: string): { isValid: boolean; sanitized: string } {
  const sanitized = phone.trim().replace(/\s/g, '')
  return {
    isValid: PHONE_REGEX.test(sanitized),
    sanitized
  }
}

// Validate contract type
export function validateContractType(type: string): type is 'CIM' | 'PFA' | 'SRL' {
  return ['CIM', 'PFA', 'SRL'].includes(type)
}

// Validate skill level
export function validateSkillLevel(level: string): level is 'Începător' | 'Intermediar' | 'Expert' {
  return ['Începător', 'Intermediar', 'Expert'].includes(level)
}

// Validate skill type
export function validateSkillType(type: string): type is 'Soft' | 'Hard' {
  return ['Soft', 'Hard'].includes(type)
}

// Validate date range
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate < endDate && startDate <= new Date()
}

// Validate user data
export function validateUserData(data: Partial<User>): {
  isValid: boolean
  errors: Record<string, string>
  sanitizedData: Partial<User>
} {
  const errors: Record<string, string> = {}
  const sanitizedData: Partial<User> = {}

  // Validate name
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else {
    sanitizedData.name = sanitizeString(data.name)
  }

  // Validate email
  if (!data.email) {
    errors.email = 'Email is required'
  } else {
    const { isValid, sanitized } = validateEmail(data.email)
    if (!isValid) {
      errors.email = 'Invalid email format'
    } else {
      sanitizedData.email = sanitized
    }
  }

  // Validate phone
  if (!data.phone) {
    errors.phone = 'Phone is required'
  } else {
    const { isValid, sanitized } = validatePhone(data.phone)
    if (!isValid) {
      errors.phone = 'Invalid phone format (Romanian format required)'
    } else {
      sanitizedData.phone = sanitized
    }
  }

  // Validate contract type
  if (!data.contractType || !validateContractType(data.contractType)) {
    errors.contractType = 'Invalid contract type'
  } else {
    sanitizedData.contractType = data.contractType
  }

  // Validate optional fields
  if (data.company) {
    sanitizedData.company = sanitizeString(data.company)
  }
  if (data.department) {
    sanitizedData.department = sanitizeString(data.department)
  }
  if (data.expertise) {
    sanitizedData.expertise = sanitizeString(data.expertise)
  }
  if (data.observations) {
    sanitizedData.observations = sanitizeString(data.observations)
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  }
}

// Validate contract data
export function validateContractData(data: Partial<{
  name: string;
  description?: string;
  location?: string;
  beneficiary?: string;
  position: string;
  startDate: Date;
  endDate: Date;
}>): {
  isValid: boolean
  errors: Record<string, string>
  sanitizedData: any
} {
  const errors: Record<string, string> = {}
  const sanitizedData: any = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Contract name is required'
  } else {
    sanitizedData.name = sanitizeString(data.name)
  }

  if (!data.position || data.position.trim().length < 2) {
    errors.position = 'Position is required'
  } else {
    sanitizedData.position = sanitizeString(data.position)
  }

  if (!data.startDate) {
    errors.startDate = 'Start date is required'
  }

  if (!data.endDate) {
    errors.endDate = 'End date is required'
  }

  if (data.startDate && data.endDate && !validateDateRange(data.startDate, data.endDate)) {
    errors.dateRange = 'End date must be after start date and dates cannot be in the future'
  }

  // Optional fields
  if (data.description) {
    sanitizedData.description = sanitizeString(data.description)
  }
  if (data.location) {
    sanitizedData.location = sanitizeString(data.location)
  }
  if (data.beneficiary) {
    sanitizedData.beneficiary = sanitizeString(data.beneficiary)
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: { ...sanitizedData, startDate: data.startDate, endDate: data.endDate }
  }
}

// Validate diploma data
export function validateDiplomaData(data: Partial<{
  name: string;
  issuer: string;
  date: Date;
}>): {
  isValid: boolean
  errors: Record<string, string>
  sanitizedData: any
} {
  const errors: Record<string, string> = {}
  const sanitizedData: any = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Diploma name is required'
  } else {
    sanitizedData.name = sanitizeString(data.name)
  }

  if (!data.issuer || data.issuer.trim().length < 2) {
    errors.issuer = 'Issuer is required'
  } else {
    sanitizedData.issuer = sanitizeString(data.issuer)
  }

  if (!data.date) {
    errors.date = 'Date is required'
  } else if (data.date > new Date()) {
    errors.date = 'Date cannot be in the future'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: { ...sanitizedData, date: data.date }
  }
}

// Validate skill data
export function validateSkillData(data: Partial<Skill>): {
  isValid: boolean
  errors: Record<string, string>
  sanitizedData: Partial<Skill>
} {
  const errors: Record<string, string> = {}
  const sanitizedData: Partial<Skill> = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Skill name is required'
  } else {
    sanitizedData.name = sanitizeString(data.name)
  }

  if (!data.level || !validateSkillLevel(data.level)) {
    errors.level = 'Invalid skill level'
  } else {
    sanitizedData.level = data.level
  }

  if (!data.type || !validateSkillType(data.type)) {
    errors.type = 'Invalid skill type'
  } else {
    sanitizedData.type = data.type
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  }
}