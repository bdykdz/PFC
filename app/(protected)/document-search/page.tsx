import { DocumentSearch } from '@/components/document-search'

export default function DocumentSearchPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Document Search</h1>
          <p className="text-muted-foreground mt-2">
            Search through employee profiles and their documents using keywords. 
            Find people by their skills, experience, or any content in their CVs and certificates.
          </p>
        </div>
        
        <DocumentSearch />
      </div>
    </div>
  )
}