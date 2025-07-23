import { NextRequest, NextResponse } from 'next/server'
import { checkUserRole } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, session } = await checkUserRole(['admin', 'editor'])
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: employeeId } = await params

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            contracts: true,
            skills: true,
            diplomas: true,
            documents: true,
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Delete all related data in the correct order to respect foreign key constraints
    
    // 1. Delete documents (files in storage would need to be handled separately)
    await prisma.document.deleteMany({
      where: { employee_id: employeeId }
    })

    // 2. Delete skills
    await prisma.skill.deleteMany({
      where: { employee_id: employeeId }
    })

    // 3. Delete diplomas
    await prisma.diploma.deleteMany({
      where: { employee_id: employeeId }
    })

    // 4. Delete contracts
    await prisma.contract.deleteMany({
      where: { employee_id: employeeId }
    })

    // 5. Finally delete the employee
    await prisma.employee.delete({
      where: { id: employeeId }
    })

    // Log the deletion activity
    await logActivity({
      userId: session?.user?.id || null,
      action: 'employee.deleted' as any,
      resourceType: 'employee',
      resourceId: employeeId,
      changes: {
        employeeName: employee.name,
        employeeEmail: employee.email,
        deletedCounts: employee._count
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Employee and all related data deleted successfully',
      deletedCounts: employee._count
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}