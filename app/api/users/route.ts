import { NextResponse } from 'next/server'

// Redirect old API calls to new endpoint
export async function POST(request: Request) {
  console.warn('WARNING: Old /api/users endpoint called - redirecting to /api/employees')
  
  // Get the request body and headers
  const body = await request.blob()
  
  // Create a new request to the employees endpoint
  const newRequest = new Request(
    new URL('/api/employees', request.url).toString(),
    {
      method: 'POST',
      headers: request.headers,
      body: body
    }
  )
  
  // Forward the request to the new endpoint
  const response = await fetch(newRequest)
  const data = await response.json()
  
  // If it's a successful employee creation, map the response
  if (response.ok && data.employeeId) {
    return NextResponse.json({
      ...data,
      userId: data.employeeId // Map employeeId to userId for backward compatibility
    })
  }
  
  return NextResponse.json(data, { status: response.status })
}

export async function GET() {
  return NextResponse.json({ 
    error: 'This endpoint has been deprecated. Use /api/employees instead.' 
  }, { status: 410 })
}