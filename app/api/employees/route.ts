import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { minioClient } from '@/lib/minio'
import { randomUUID } from 'crypto'
import { logActivity, getClientIp } from '@/lib/activity-logger'
import { canUserEdit } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !canUserEdit(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Parse employee data
    const employeeData = JSON.parse(formData.get('employeeData') as string)
    const contracts = JSON.parse(formData.get('contracts') as string)
    const diplomas = JSON.parse(formData.get('diplomas') as string)
    const skills = JSON.parse(formData.get('skills') as string)
    const generalDocuments = JSON.parse(formData.get('generalDocuments') as string || '[]')
    
    // Validate required fields
    if (!employeeData.email || !employeeData.name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }
    
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists('people-finder')
    if (!bucketExists) {
      await minioClient.makeBucket('people-finder', 'us-east-1')
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        email: employeeData.email,
        name: employeeData.name,
        phone: employeeData.phone || null,
        azure_id: employeeData.azure_id || null,
        contract_type: employeeData.contractType || null,
        company: employeeData.company || null,
        department: employeeData.department || null,
        expertise: employeeData.expertise || null,
        general_experience: employeeData.general_experience ? new Date(employeeData.general_experience) : null,
        observations: employeeData.observations || null,
        created_by_id: session.user.id,
        updated_by_id: session.user.id,
      }
    })

    // Process contracts with documents
    for (let contractIndex = 0; contractIndex < contracts.length; contractIndex++) {
      const contractData = contracts[contractIndex]
      
      const contract = await prisma.contract.create({
        data: {
          employee_id: employee.id,
          name: contractData.name,
          description: contractData.description || null,
          location: contractData.location || null,
          beneficiary: contractData.beneficiary || null,
          position: contractData.position || null,
          contract_number: contractData.contract_number || null,
          start_date: contractData.start_date ? new Date(contractData.start_date) : new Date(),
          end_date: contractData.end_date ? new Date(contractData.end_date) : null,
        }
      })

      // Upload contract documents
      let docIndex = 0
      let docFile = formData.get(`contract_${contractIndex}_doc_${docIndex}`) as File
      
      while (docFile) {
        const fileName = `contracts/${employee.id}/${contract.id}/${randomUUID()}_${docFile.name}`
        const buffer = Buffer.from(await docFile.arrayBuffer())
        
        await minioClient.putObject('people-finder', fileName, buffer, buffer.length, {
          'Content-Type': docFile.type
        })

        await prisma.contractDocument.create({
          data: {
            name: docFile.name,
            file_url: fileName,
            contract_id: contract.id,
          }
        })

        docIndex++
        docFile = formData.get(`contract_${contractIndex}_doc_${docIndex}`) as File
      }
    }

    // Process diplomas with documents
    for (let diplomaIndex = 0; diplomaIndex < diplomas.length; diplomaIndex++) {
      const diplomaData = diplomas[diplomaIndex]
      
      const diploma = await prisma.diploma.create({
        data: {
          employee_id: employee.id,
          name: diplomaData.name,
          issuer: diplomaData.issuer || null,
          issue_date: diplomaData.issue_date ? new Date(diplomaData.issue_date) : new Date(),
          expiry_date: diplomaData.expiry_date ? new Date(diplomaData.expiry_date) : null,
        }
      })

      // Upload diploma documents
      let docIndex = 0
      let docFile = formData.get(`diploma_${diplomaIndex}_doc_${docIndex}`) as File
      
      while (docFile) {
        const fileName = `diplomas/${employee.id}/${diploma.id}/${randomUUID()}_${docFile.name}`
        const buffer = Buffer.from(await docFile.arrayBuffer())
        
        await minioClient.putObject('people-finder', fileName, buffer, buffer.length, {
          'Content-Type': docFile.type
        })

        await prisma.diplomaDocument.create({
          data: {
            name: docFile.name,
            file_url: fileName,
            diploma_id: diploma.id,
          }
        })

        docIndex++
        docFile = formData.get(`diploma_${diplomaIndex}_doc_${docIndex}`) as File
      }
    }

    // Create skills
    for (const skill of skills) {
      await prisma.skill.create({
        data: {
          employee_id: employee.id,
          name: skill.name,
          level: skill.level,
          type: skill.type,
        }
      })
    }

    // Upload general documents
    for (let docIndex = 0; docIndex < generalDocuments.length; docIndex++) {
      const docData = generalDocuments[docIndex]
      let docFile = formData.get(`general_doc_${docIndex}`) as File
      
      if (docFile) {
        const fileName = `documents/${employee.id}/${randomUUID()}_${docFile.name}`
        const buffer = Buffer.from(await docFile.arrayBuffer())
        
        await minioClient.putObject('people-finder', fileName, buffer, buffer.length, {
          'Content-Type': docFile.type
        })

        await prisma.document.create({
          data: {
            name: docData.name,
            file_url: fileName,
            employee_id: employee.id,
          }
        })
      }
    }

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'employee.created',
      resourceType: 'employee',
      resourceId: employee.id,
      changes: {
        name: employee.name,
        email: employee.email,
        department: employee.department,
        company: employee.company
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({ 
      success: true,
      employeeId: employee.id 
    })

  } catch (error: any) {
    console.error('Error creating employee:', error)
    
    // Return more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Employee with this email already exists' }, { status: 400 })
    }
    
    if (error.message?.includes('Invalid Date')) {
      return NextResponse.json({ error: 'Invalid date format provided' }, { status: 400 })
    }
    
    if (error.message?.includes('MinIO')) {
      return NextResponse.json({ error: 'File storage service unavailable' }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create employee', 
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const department = searchParams.get('department')
    const company = searchParams.get('company')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { expertise: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (department) {
      where.department = department
    }

    if (company) {
      where.company = company
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          contracts: {
            orderBy: { start_date: 'desc' },
            take: 1,
          },
          skills: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.employee.count({ where }),
    ])

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch employees', 
      details: error.message 
    }, { status: 500 })
  }
}