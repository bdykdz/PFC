'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchFilters {
  name?: string
  contractType?: string
  company?: string
  department?: string
  expertise?: string
  minExperience?: number
  positionExperience?: string
  minContracts?: number
  diploma?: string
  issuer?: string
  contractBeneficiary?: string
  contractLocation?: string
  availability?: {
    excel?: boolean
    travel?: boolean
    relocation?: boolean
  }
}

interface SearchResult {
  id: string
  name: string
  contractType: string
  company?: string
  department?: string
  expertise?: string
  profileImage?: string
}

const ITEMS_PER_PAGE = 20

export default function SearchPageOptimized() {
  const router = useRouter()
  const [filters, setFilters] = useState<SearchFilters>({
    availability: {}
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(false)

  // Debounce search inputs
  const debouncedName = useDebounce(filters.name, 300)
  const debouncedCompany = useDebounce(filters.company, 300)
  const debouncedDepartment = useDebounce(filters.department, 300)

  // Search function
  const performSearch = useCallback(async (isNextPage = false) => {
    setLoading(true)

    try {
      const constraints: Parameters<typeof query>[1][] = []

      // Add filters
      if (filters.contractType) {
        constraints.push(where('contractType', '==', filters.contractType))
      }

      if (debouncedCompany) {
        constraints.push(where('company', '==', debouncedCompany))
      }

      if (debouncedDepartment) {
        constraints.push(where('department', '==', debouncedDepartment))
      }

      // Add ordering and pagination
      constraints.push(orderBy('name'))
      constraints.push(limit(ITEMS_PER_PAGE))

      // If loading next page, start after last document
      if (isNextPage && lastDoc) {
        constraints.push(startAfter(lastDoc))
      }

      const q = query(collection(db, 'users'), ...constraints)
      const querySnapshot = await getDocs(q)
      
      const searchResults: SearchResult[] = []
      querySnapshot.forEach(doc => {
        const data = doc.data()
        
        // Client-side filtering for fields that can't be efficiently queried
        if (debouncedName && !data.name.toLowerCase().includes(debouncedName.toLowerCase())) {
          return
        }
        
        if (filters.expertise && !data.expertise?.toLowerCase().includes(filters.expertise.toLowerCase())) {
          return
        }

        searchResults.push({
          id: doc.id,
          name: data.name,
          contractType: data.contractType,
          company: data.company,
          department: data.department,
          expertise: data.expertise,
          profileImage: data.profileImage
        })
      })

      // Update state
      if (isNextPage) {
        setResults(prev => [...prev, ...searchResults])
      } else {
        setResults(searchResults)
        setCurrentPage(1)
      }

      // Set pagination state
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
      setLastDoc(lastVisible || null)
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE)
      
      // For first page, get total count (expensive, so only do once)
      if (!isNextPage) {
        const countQuery = query(collection(db, 'users'), ...constraints.slice(0, -2)) // Remove limit and startAfter
        const countSnapshot = await getDocs(countQuery)
        setTotalResults(countSnapshot.size)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, debouncedName, debouncedCompany, debouncedDepartment, lastDoc])

  // Auto-search when filters change
  useEffect(() => {
    performSearch()
  }, [filters.contractType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextPage = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1)
      performSearch(true)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(1)
      performSearch()
    }
  }

  const handleCardClick = (id: string) => {
    router.push(`/profile/${id}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search Profiles</h1>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); performSearch(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  aria-label="Search by name"
                  value={filters.name || ''}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  placeholder="Search by name"
                />
              </div>

              <div>
                <Label htmlFor="contractType">Contract Type</Label>
                <Select
                  value={filters.contractType || ''}
                  onValueChange={(value) => setFilters({ ...filters, contractType: value })}
                >
                  <SelectTrigger id="contractType" aria-label="Select contract type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="CIM">CIM</SelectItem>
                    <SelectItem value="PFA">PFA</SelectItem>
                    <SelectItem value="SRL">SRL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  aria-label="Filter by company"
                  value={filters.company || ''}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  aria-label="Filter by department"
                  value={filters.department || ''}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  placeholder="Department"
                />
              </div>

              <div>
                <Label htmlFor="expertise">Expertise</Label>
                <Input
                  id="expertise"
                  aria-label="Filter by expertise"
                  value={filters.expertise || ''}
                  onChange={(e) => setFilters({ ...filters, expertise: e.target.value })}
                  placeholder="Area of expertise"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Results {results.length > 0 && `(${totalResults} total)`}
          </h2>
          {results.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {loading && results.length === 0 ? (
          <div className="text-center py-8">Loading...</div>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No results found. Try adjusting your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <Card 
                key={result.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleCardClick(result.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Image
                      src={result.profileImage || "/placeholder.svg"}
                      alt={result.name}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{result.name}</h3>
                      <p className="text-sm text-muted-foreground">{result.contractType}</p>
                      {result.company && (
                        <p className="text-sm text-muted-foreground">{result.company}</p>
                      )}
                      {result.expertise && (
                        <p className="text-sm text-muted-foreground">{result.expertise}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {loading && results.length > 0 && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading more results...</p>
          </div>
        )}
      </div>
    </div>
  )
}