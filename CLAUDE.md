# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

People Finder Containerized (PFC) is a Next.js application for managing employee profiles and documents with full-text search capabilities. The system includes document processing with OCR, Azure AD integration, and OpenSearch for advanced search functionality.

## Commands

### Development
```bash
npm run dev                    # Start development server on port 3000
npm run dev:https              # Start development server with HTTPS
npm run build                  # Build the production application
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run type-check             # Run TypeScript type checking
```

### Database Management
```bash
npm run db:migrate             # Deploy Prisma migrations to database
npm run db:generate            # Generate Prisma client
./scripts/docker-migrate.sh    # Run migrations in Docker environment
```

### Admin User Management
```bash
npm run create-admin           # Create admin user (interactive)
npm run create-admin:direct    # Create admin user (direct)
```

### Docker Operations
```bash
docker-compose up -d                              # Start all services
docker-compose up -d postgres minio opensearch   # Start infrastructure only
docker-compose run --rm app node scripts/init-minio.js           # Initialize MinIO bucket
docker-compose run --rm app node scripts/setup-opensearch-indices.js  # Setup search indices
docker-compose logs -f app                       # View application logs
docker-compose logs -f document-processor        # View document processor logs
```

## Architecture

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Azure AD support
- **File Storage**: MinIO (S3-compatible)
- **Search**: OpenSearch for full-text search
- **Document Processing**: Background worker with OCR capabilities
- **Styling**: Tailwind CSS with Radix UI components

### Directory Structure
```
app/                           # Next.js App Router pages
├── (auth)/                   # Authentication pages
├── (protected)/              # Protected application pages
│   ├── add-person/          # Employee creation
│   ├── admin/               # Admin panel
│   ├── document-search/     # Document search interface
│   ├── edit-profile/        # Profile editing
│   ├── profile/            # Profile viewing
│   └── search/             # Employee search
├── api/                     # API routes
│   ├── admin/              # Admin endpoints
│   ├── auth/               # Authentication endpoints
│   ├── documents/          # Document management
│   ├── employees/          # Employee CRUD
│   ├── health/             # Health check
│   └── search/             # Search endpoints
└── setup/                  # Initial setup pages

components/                   # Reusable React components
├── search/                  # Search-related components
└── ui/                     # Base UI components (shadcn/ui)

lib/                         # Utility libraries
├── auth-options.ts         # NextAuth configuration
├── document-processor.ts   # Document processing logic
├── microsoft-graph.ts      # Azure AD Graph API client
├── minio.ts               # MinIO client configuration
├── prisma.ts              # Database client
└── storage.ts             # File storage utilities

prisma/
└── schema.prisma          # Database schema definition

scripts/                   # Utility scripts
├── create-admin.js        # Admin user creation
├── init-minio.js         # MinIO initialization
├── setup-opensearch-indices.js  # Search setup
└── document-processor-worker.js # Background document processor
```

### Database Schema
The system uses a PostgreSQL database with the following main entities:
- **User**: Application users with role-based permissions (viewer, editor, manager, admin)
- **Employee**: Employee profiles with personal and professional information
- **Contract**: Employment contracts with associated documents
- **Diploma**: Educational credentials with document attachments
- **Skill**: Technical and soft skills with proficiency levels
- **Document**: General documents with full-text search capabilities
- **AuditLog**: System activity tracking
- **SavedSearch**: User-saved search queries

### Authentication & Authorization
- Azure AD integration for SSO
- Role-based access control (viewer, editor, manager, admin)
- NextAuth.js handles session management
- Microsoft Graph API for user profile sync

### Document Processing
- Automatic background processing of uploaded documents
- OCR support for scanned PDFs and images using Tesseract
- Text extraction from various formats (PDF, DOCX, etc.)
- Full-text indexing in OpenSearch
- Multi-language support (Romanian, English, Portuguese, French, German)

### Search Capabilities
- Employee search with filters (department, skills, contract type)
- Document full-text search with highlighting
- Saved search functionality
- Advanced filtering and sorting options

## Environment Configuration

The application requires several environment files:
- `.env.example` - Template for local development
- `.env.production.example` - Template for production deployment
- `.env.cloudflare.example` - Template for Cloudflare deployment

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL for authentication
- `NEXTAUTH_SECRET` - JWT signing secret
- `AZURE_AD_*` - Azure AD configuration
- `MINIO_*` - MinIO storage configuration
- `OPENSEARCH_URL` - OpenSearch endpoint

## Docker Configuration

Multiple Docker Compose configurations:
- `docker-compose.yml` - Basic development setup
- `docker-compose.local.yml` - Local development with all services
- `docker-compose.production.yml` - Production deployment
- `docker-compose.cloudflare.yml` - Cloudflare tunnel deployment

## Development Workflow

1. **Setup**: Copy `.env.example` to `.env` and configure
2. **Database**: Run `npm run db:migrate` to initialize schema
3. **Development**: Use `npm run dev` for local development
4. **Type Safety**: Run `npm run type-check` before committing
5. **Linting**: Run `npm run lint` to ensure code quality

## Deployment

See `DEPLOYMENT_GUIDE.md` for detailed production deployment instructions. The application supports multiple deployment scenarios including standalone servers, Cloudflare tunnels, and existing server integration.

## Important Notes

- Document processing runs automatically every 30 seconds via background worker
- OCR processing requires significant CPU resources
- MinIO requires initialization before first use
- OpenSearch indices must be created before document indexing
- Azure AD integration is optional but recommended for enterprise deployment