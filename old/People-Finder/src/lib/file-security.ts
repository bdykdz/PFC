// File upload security configuration and validation

// Allowed file types for documents
const ALLOWED_FILE_TYPES = {
  documents: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
}

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  document: 10 * 1024 * 1024, // 10MB
  image: 5 * 1024 * 1024 // 5MB
}

// Allowed file extensions
const ALLOWED_EXTENSIONS = {
  documents: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  images: ['.jpg', '.jpeg', '.png', '.webp']
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
  sanitizedFileName?: string
}

// Sanitize filename to prevent path traversal attacks
export function sanitizeFileName(fileName: string): string {
  // Remove any path components
  const baseName = fileName.split(/[/\\]/).pop() || fileName
  
  // Remove dangerous characters
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '_') // Replace multiple dots
    .replace(/^\./, '_') // Replace leading dot
    
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now()
  const parts = sanitized.split('.')
  const extension = parts.length > 1 ? `.${parts.pop()}` : ''
  const name = parts.join('.')
  
  return `${timestamp}_${name}${extension}`
}

// Validate file type
export function validateFileType(file: File, category: 'documents' | 'images'): boolean {
  const allowedTypes = ALLOWED_FILE_TYPES[category]
  return allowedTypes.includes(file.type)
}

// Validate file extension
export function validateFileExtension(fileName: string, category: 'documents' | 'images'): boolean {
  const allowedExtensions = ALLOWED_EXTENSIONS[category]
  const extension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0]
  return extension ? allowedExtensions.includes(extension) : false
}

// Validate file size
export function validateFileSize(file: File, category: 'documents' | 'images'): boolean {
  const limit = category === 'documents' ? FILE_SIZE_LIMITS.document : FILE_SIZE_LIMITS.image
  return file.size <= limit
}

// Comprehensive file validation
export function validateFile(file: File, category: 'documents' | 'images' = 'documents'): FileValidationResult {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' }
  }

  // Validate file size
  if (!validateFileSize(file, category)) {
    const limitMB = (category === 'documents' ? FILE_SIZE_LIMITS.document : FILE_SIZE_LIMITS.image) / (1024 * 1024)
    return { isValid: false, error: `File size exceeds ${limitMB}MB limit` }
  }

  // Validate file type
  if (!validateFileType(file, category)) {
    return { isValid: false, error: 'Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX' }
  }

  // Validate file extension
  if (!validateFileExtension(file.name, category)) {
    return { isValid: false, error: 'Invalid file extension' }
  }

  // Additional security checks
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { isValid: false, error: 'Invalid file name' }
  }

  // Sanitize filename
  const sanitizedFileName = sanitizeFileName(file.name)

  return { 
    isValid: true, 
    sanitizedFileName 
  }
}

// Generate secure storage path
export function generateStoragePath(userId: string, category: string, fileName: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  
  // Structure: users/{userId}/{category}/{year}/{month}/{sanitized_filename}
  return `users/${userId}/${category}/${year}/${month}/${fileName}`
}

// Validate multiple files
export function validateFiles(files: File[], category: 'documents' | 'images' = 'documents'): {
  valid: File[]
  invalid: { file: File; error: string }[]
} {
  const valid: File[] = []
  const invalid: { file: File; error: string }[] = []

  files.forEach(file => {
    const validation = validateFile(file, category)
    if (validation.isValid) {
      valid.push(file)
    } else {
      invalid.push({ file, error: validation.error || 'Unknown error' })
    }
  })

  return { valid, invalid }
}