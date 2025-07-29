import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { processDocument } from '@/lib/document-processor'
import { uploadBufferToMinio } from '@/lib/minio'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { lookup } from 'mime-types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const employeeId = formData.get('employeeId') as string

    if (!file || !employeeId) {
      return NextResponse.json(
        { error: 'Missing file or employeeId' },
        { status: 400 }
      )
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get file info
    const fileName = file.name
    const fileType = file.type || lookup(fileName) || 'application/octet-stream'
    const fileSize = buffer.length

    // Generate unique file name for storage
    const timestamp = Date.now()
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storageFileName = `${employeeId}/${timestamp}-${safeFileName}`

    // Upload to MinIO
    const fileUrl = await uploadBufferToMinio(buffer, storageFileName, fileType)

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        employee_id: employeeId,
        name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize
      }
    })

    // Document will be automatically processed by the document-processor worker

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'document_upload',
        resource_type: 'document',
        resource_id: document.id,
        changes: {
          fileName,
          fileType,
          fileSize,
          employeeId
        }
      }
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        fileUrl: document.file_url,
        fileType: document.file_type,
        fileSize: document.file_size,
        uploadedAt: document.uploaded_at
      },
      message: 'Document uploaded successfully. Processing in background...'
    })
  } catch (error) {
    // Document upload error
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}