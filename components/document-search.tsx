'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, FileText, User, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/use-debounce'
import Link from 'next/link'

interface SearchResult {
  id: string
  name: string
  email?: string
  department?: string
  role?: string
  type: 'employee' | 'document-only'
  _score: number
  _highlights?: any
  matchingDocuments: {
    id: string
    fileName: string
    highlights: string[]
    score: number
  }[]
}

interface SearchResponse {
  query: string
  total: number
  results: SearchResult[]
}

export function DocumentSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const debouncedQuery = useDebounce(query, 300)

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: SearchResponse = await response.json()
      setResults(data.results || [])
    } catch (err) {
      setError('Failed to perform search. Please try again.')
      // Search error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery)
    }
  }, [debouncedQuery, performSearch])

  const highlightText = (text: string) => {
    return { __html: text }
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search employees by name, skills, or document content (e.g., 'supervizare canal')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"
          </p>

          {results.map((result) => (
            <Card key={result.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Link 
                        href={`/employees/${result.id}`}
                        className="hover:underline"
                      >
                        {result.name}
                      </Link>
                    </CardTitle>
                    {result.email && (
                      <CardDescription>{result.email}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {result.department && (
                      <Badge variant="secondary">{result.department}</Badge>
                    )}
                    {result.role && (
                      <Badge variant="outline">{result.role}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              {result.matchingDocuments.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Matching documents:
                    </p>
                    {result.matchingDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-lg border bg-muted/30 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.fileName}
                        </div>
                        {doc.highlights.length > 0 && (
                          <div className="space-y-1">
                            {doc.highlights.slice(0, 3).map((highlight, idx) => (
                              <p
                                key={idx}
                                className="text-sm text-muted-foreground"
                                dangerouslySetInnerHTML={highlightText(highlight)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No results found for "{query}". Try different keywords.
          </p>
        </div>
      )}
    </div>
  )
}