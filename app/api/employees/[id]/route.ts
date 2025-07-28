import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { uploadToMinio, deleteFromMinio } from '@/lib/minio'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = params.id
    console.log('Updating employee:', employeeId)
    
    const formData = await request.formData()

    // Parse the JSON data
    const userData = JSON.parse(formData.get('userData') as string || '{}')
    const deleteData = JSON.parse(formData.get('deleteData') as string || '{"skills":[],"contracts":[],"diplomas":[],"documents":[]}')
    const contractsData = JSON.parse(formData.get('contracts') as string || '[]')
    const diplomasData = JSON.parse(formData.get('diplomas') as string || '[]')
    const skillsData = JSON.parse(formData.get('skills') as string || '[]')
    const generalDocsData = JSON.parse(formData.get('generalDocuments') as string || '[]')
    
    console.log('Parsed data:', {
      userData,
      deleteData,
      contractsCount: contractsData.length,
      diplomasCount: diplomasData.length,
      skillsCount: skillsData.length,
      generalDocsCount: generalDocsData.length
    })

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update employee data
      const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          contract_type: userData.contractType,
          company: userData.company,
          department: userData.department,
          expertise: userData.expertise,
          general_experience: userData.general_experience,
          observations: userData.observations,
          updated_by_id: session.user.id,
        },
      })

      // Delete items
      if (deleteData.skills.length > 0) {
        await tx.skill.deleteMany({
          where: { id: { in: deleteData.skills } },
        })
      }

      if (deleteData.contracts.length > 0) {
        // Delete contract documents from MinIO
        const contractDocs = await tx.contractDocument.findMany({
          where: { contract_id: { in: deleteData.contracts } },
        })
        for (const doc of contractDocs) {
          if (doc.file_url) {
            await deleteFromMinio(doc.file_url)
          }
        }
        await tx.contract.deleteMany({
          where: { id: { in: deleteData.contracts } },
        })
      }

      if (deleteData.diplomas.length > 0) {
        // Delete diploma documents from MinIO
        const diplomaDocs = await tx.diplomaDocument.findMany({
          where: { diploma_id: { in: deleteData.diplomas } },
        })
        for (const doc of diplomaDocs) {
          if (doc.file_url) {
            await deleteFromMinio(doc.file_url)
          }
        }
        await tx.diploma.deleteMany({
          where: { id: { in: deleteData.diplomas } },
        })
      }

      if (deleteData.documents.length > 0) {
        // Delete documents from MinIO
        const docsToDelete = await tx.document.findMany({
          where: { id: { in: deleteData.documents } },
        })
        for (const doc of docsToDelete) {
          if (doc.file_url) {
            await deleteFromMinio(doc.file_url)
          }
        }
        await tx.document.deleteMany({
          where: { id: { in: deleteData.documents } },
        })
      }

      // Update/create contracts
      for (let i = 0; i < contractsData.length; i++) {
        const contract = contractsData[i]
        let contractRecord

        if (contract.id) {
          // Update existing contract
          contractRecord = await tx.contract.update({
            where: { id: contract.id },
            data: {
              name: contract.name,
              description: contract.description,
              location: contract.location,
              beneficiary: contract.beneficiary,
              position: contract.position,
              contract_number: contract.contract_number,
              start_date: new Date(contract.start_date),
              end_date: contract.end_date ? new Date(contract.end_date) : null,
            },
          })
        } else {
          // Create new contract
          contractRecord = await tx.contract.create({
            data: {
              employee_id: employeeId,
              name: contract.name,
              description: contract.description,
              location: contract.location,
              beneficiary: contract.beneficiary,
              position: contract.position,
              contract_number: contract.contract_number,
              start_date: new Date(contract.start_date),
              end_date: contract.end_date ? new Date(contract.end_date) : null,
            },
          })
        }

        // Handle contract documents
        const contractDocs = []
        let docIndex = 0
        while (formData.has(`contract_${i}_doc_${docIndex}`)) {
          const file = formData.get(`contract_${i}_doc_${docIndex}`) as File
          if (file) {
            const fileUrl = await uploadToMinio(file, `contracts/${contractRecord.id}`)
            contractDocs.push({
              name: file.name,
              file_url: fileUrl,
              contract_id: contractRecord.id,
            })
          }
          docIndex++
        }

        if (contractDocs.length > 0) {
          await tx.contractDocument.createMany({ data: contractDocs })
        }
      }

      // Update/create diplomas
      for (let i = 0; i < diplomasData.length; i++) {
        const diploma = diplomasData[i]
        let diplomaRecord

        if (diploma.id) {
          // Update existing diploma
          diplomaRecord = await tx.diploma.update({
            where: { id: diploma.id },
            data: {
              name: diploma.name,
              issuer: diploma.issuer,
              issue_date: new Date(diploma.issue_date),
              expiry_date: diploma.expiry_date ? new Date(diploma.expiry_date) : null,
            },
          })
        } else {
          // Create new diploma
          diplomaRecord = await tx.diploma.create({
            data: {
              employee_id: employeeId,
              name: diploma.name,
              issuer: diploma.issuer,
              issue_date: new Date(diploma.issue_date),
              expiry_date: diploma.expiry_date ? new Date(diploma.expiry_date) : null,
            },
          })
        }

        // Handle diploma documents
        const diplomaDocs = []
        let docIndex = 0
        while (formData.has(`diploma_${i}_doc_${docIndex}`)) {
          const file = formData.get(`diploma_${i}_doc_${docIndex}`) as File
          if (file) {
            const fileUrl = await uploadToMinio(file, `diplomas/${diplomaRecord.id}`)
            diplomaDocs.push({
              name: file.name,
              file_url: fileUrl,
              diploma_id: diplomaRecord.id,
            })
          }
          docIndex++
        }

        if (diplomaDocs.length > 0) {
          await tx.diplomaDocument.createMany({ data: diplomaDocs })
        }
      }

      // Update/create skills
      for (const skill of skillsData) {
        if (skill.id) {
          // Update existing skill
          await tx.skill.update({
            where: { id: skill.id },
            data: {
              name: skill.name,
              level: skill.level,
              type: skill.type,
            },
          })
        } else {
          // Create new skill
          await tx.skill.create({
            data: {
              employee_id: employeeId,
              name: skill.name,
              level: skill.level,
              type: skill.type,
            },
          })
        }
      }

      // Handle general documents
      const generalDocs = []
      let docIndex = 0
      while (formData.has(`general_doc_${docIndex}`)) {
        const file = formData.get(`general_doc_${docIndex}`) as File
        if (file && generalDocsData[docIndex]) {
          const fileUrl = await uploadToMinio(file, `employees/${employeeId}/documents`)
          generalDocs.push({
            name: generalDocsData[docIndex].name || file.name,
            file_url: fileUrl,
            employee_id: employeeId,
          })
        }
        docIndex++
      }

      if (generalDocs.length > 0) {
        await tx.document.createMany({ data: generalDocs })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          user_id: session.user.id,
          action: 'UPDATE',
          resource_type: 'employee',
          resource_id: employeeId,
          changes: {
            userData,
            contractsUpdated: contractsData.length,
            diplomasUpdated: diplomasData.length,
            skillsUpdated: skillsData.length,
            documentsAdded: generalDocs.length,
            itemsDeleted: deleteData,
          },
        },
      })

      return updatedEmployee
    })

    return NextResponse.json({
      success: true,
      employee: result,
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to update employee profile',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}