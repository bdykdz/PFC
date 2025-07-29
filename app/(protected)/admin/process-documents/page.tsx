'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface UnprocessedDocument {
  id: string
  name: string
  file_type: string
  uploaded_at: string
  employee: {
    name: string
  }
}

export default function ProcessDocumentsPage() {
  const [documents, setDocuments] = useState<UnprocessedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [processed, setProcessed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchUnprocessedDocuments()
  }, [])

  const fetchUnprocessedDocuments = async () => {
    try {
      const response = await fetch('/api/documents/process')
      if (!response.ok) throw new Error('Failed to fetch documents')
      
      const data = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      toast.error('Failed to load unprocessed documents')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const processDocument = async (documentId: string) => {
    setProcessing(documentId)
    
    try {
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId })
      })

      if (!response.ok) throw new Error('Failed to process document')

      const result = await response.json()
      setProcessed(prev => new Set([...prev, documentId]))
      
      toast.success(`Document processed successfully! Language: ${result.document.language}`)
    } catch (error) {
      toast.error('Failed to process document')
      console.error(error)
    } finally {
      setProcessing(null)
    }
  }

  const processAllDocuments = async () => {
    for (const doc of documents) {
      if (!processed.has(doc.id)) {
        await processDocument(doc.id)
        // Small delay between documents
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Process Documents</h1>
          <p className="text-muted-foreground mt-2">
            Extract text and index documents for searching. This includes OCR for scanned documents.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unprocessed Documents ({documents.length})</CardTitle>
            <CardDescription>
              These documents have been uploaded but not yet processed for search
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                All documents have been processed!
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button 
                    onClick={processAllDocuments}
                    disabled={processing !== null}
                  >
                    Process All Documents
                  </Button>
                </div>

                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.employee.name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {processed.has(doc.id) ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : processing === doc.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => processDocument(doc.id)}
                            disabled={processing !== null}
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}