import { prisma } from '@/lib/prisma'

export type ActivityAction = 
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.role_changed'
  | 'user.status_changed'
  | 'user.password_reset'
  | 'user.imported'
  | 'employee.created'
  | 'employee.updated'
  | 'employee.deleted'
  | 'employee.viewed'
  | 'contract.created'
  | 'contract.updated'
  | 'contract.deleted'
  | 'diploma.created'
  | 'diploma.updated'
  | 'diploma.deleted'
  | 'skill.created'
  | 'skill.updated'
  | 'skill.deleted'
  | 'document.uploaded'
  | 'document.deleted'
  | 'document.downloaded'
  | 'import.azure_users'
  | 'export.data'

export type ResourceType = 'user' | 'employee' | 'contract' | 'diploma' | 'skill' | 'document' | 'system'

interface LogActivityParams {
  userId: string | null
  action: ActivityAction
  resourceType: ResourceType
  resourceId?: string
  changes?: any
  ipAddress?: string
  userAgent?: string
}

export async function logActivity({
  userId,
  action,
  resourceType,
  resourceId,
  changes,
  ipAddress,
  userAgent
}: LogActivityParams) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes: changes ? changes : undefined,
        ip_address: ipAddress,
        user_agent: userAgent
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - we don't want logging failures to break the app
  }
}

// Helper to get IP address from request headers
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp || undefined
}