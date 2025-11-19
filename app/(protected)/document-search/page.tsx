import { DocumentSearch } from '@/components/document-search'

export default function DocumentSearchPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Document Search</h1>
        <p className="text-muted-foreground">
          Search through employee profiles and their documents using keywords. 
          Find people by their skills, experience, or any content in their CVs and certificates.
        </p>
      </div>
      
      <DocumentSearch />
    </div>
  )
}