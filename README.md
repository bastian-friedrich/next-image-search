# Next Image Search

Welcome to the **Image Search Application**! 👋

This is a modern web application for searching and browsing a large collection of images with advanced filtering, pagination, and full-text search capabilities.

**Live Demo**: [https://next-image-search.vercel.app/](https://next-image-search.vercel.app/)

## About This Project

This project demonstrates a full-stack search application focused on practical relevance ranking, clear filtering, and a clean UI. The application lets users search through thousands of images with filters (credit, restrictions, date range) and sorting. Results are paginated and presented in a responsive interface.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Code Quality**: Biome (linting & formatting)
- **Deployment**: Vercel

## Project Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env file with your DATABASE_URL
cp .env.example .env.local

# Run database migrations
npm run prisma

# (Optional) Normalize existing data
npm run normalize-data

# Start development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
# Development
npm run dev             # Start Next.js dev server with hot reload

# Database
npm run prisma          # Run pending migrations
npm run prisma:studio   # Open Prisma Studio (visual DB browser)

# Data Processing
npm run normalize-data  # Preprocess and normalize image metadata (run once after initial data import)

# Code Quality
npm run lint           # Run Biome linter
npm run format         # Format code with Biome
```

## High-Level Approach

### 1. Project Initialization
- Set up a clean Next.js project with TypeScript
- Configured Biome for consistent code linting and formatting
- Established project structure with clear separation of concerns (components, API routes, utilities)

### 2. Database Initialization
- Set up PostgreSQL database connection via Prisma
- Configured Prisma client generation to custom output path

### 3. Database Structure
- Created `Images` model with core fields: `bildnummer`, `fotografen`, `datum`, `suchtext`, `hoehe`, `breite`
- Added `restriction` field for usage restrictions
- Added `people` and `locations` arrays for normalized data
- Created `SearchLog` model for analytics and performance monitoring

### 4. API Development (Step by Step)
- Built `/api/search` endpoint with support for:
  - **PostgreSQL Full-Text Search (FTS)** with relevance ranking
  - Multi-field search across `suchtext`, `fotografen`, `bildnummer` with weighted scoring
  - Filtering by credit (photographer) and restrictions
  - Date range filtering
  - Pagination with configurable page size
  - Sorting by date (ascending/descending)
  - Asynchronous search logging for performance tracking

### 5. Search Implementation & Optimization
- **Phase 1**: Started with basic SQL `ILIKE` queries for rapid prototyping
- **Phase 2**: Implemented PostgreSQL native Full-Text Search (FTS) with GIN indexes
- **Current approach**:
  - Combined FTS index covering all searchable fields with weights:
    - `suchtext` (weight A - highest priority)
    - `fotografen` (weight B - medium priority)
    - `bildnummer` (weight C - lowest priority)
  - Results ranked by `ts_rank()` for relevance, then by date
  - Word stemming (search "mountain" matches "mountains")
  - Phrase matching support
  - Faster and more relevant than basic string matching when indexed

### 6. Data Normalization
- Implemented `normalize-data` script to preprocess image metadata
- Extracts structured fields for filtering and analytics
- Script adds `normalizeVersion` field to track which items have been processed
- **Run once** after initial data import: `npm run normalize-data`

### 7. Backend Completion
- Ensured API returns paginated results with metadata (totalPages, total count)
- Integrated search logging for monitoring query patterns and performance

### 8. Frontend Development
- Built responsive search form with:
  - Query input field
  - Credit dropdown
  - Multi-select restrictions filter
  - Date range picker
  - Sort order selection
- Implemented pagination controls with page size and current page selection
- Created result grid displaying:
  - Bildnummer (image identifier)
  - Suchtext (with search query highlighting)
  - Fotografen (photographer/credit)
  - Datum (date)
- Added loading, error, and empty states
- Integrated data fetching with real-time updates on filter/pagination changes
- **Note**: UI development was AI-assisted due to time constraints and repetitive styling requirements

## Assumptions

1. **Database Existence**: The PostgreSQL database is already set up and accessible
2. **Data Normalization Necessity**: Raw data requires normalization to improve search performance and consistency
3. **Index Strategy**: Database indexes are added during normalization on frequently queried fields (`suchtext`, `fotografen`, `bildnummer`, `restriction`)
4. **One-Time Processing**: Normalization is a one-time build-time operation for existing data
5. **Search Performance**: Most performance gains come from proper indexing and normalized data structure

## Data Normalization Approach

### What Gets Preprocessed

- **Restrictions**: Regex-extracted from `suchtext` and stored in `restriction`
- **People/Locations**: Parsed from `suchtext` (comma-separated segments) into arrays
- **normalizeVersion**: Tracks processed rows for incremental normalization
- **Full-Text Search Index**: Combined GIN index created via migrations

### Why It Helps

1. **Query Performance**: GIN indexes reduce the candidate set for ranking
2. **Search Relevance**: `ts_rank()` provides meaningful ordering
3. **Word Stemming**: Matches word variations (mountain/mountains, run/running)
4. **Consistency**: Extracted fields are reliably filterable
5. **Multi-Field Search**: Single index covers all searchable fields with weights

### Search Scoring & Weights

The application uses PostgreSQL's built-in FTS weighting system:

| Field | Weight | Priority | Use Case |
|-------|--------|----------|----------|
| `suchtext` | A | Highest | Primary image description/content |
| `fotografen` | B | Medium | Photographer/credit attribution |
| `bildnummer` | C | Lowest | Technical image identifier |

Results are ranked using `ts_rank()` which considers:
- Term frequency in the document
- Document length normalization
- Field weights (A > B > C)
- Query term proximity

### Where It Happens

- **Build Time** (Run Once):
  - `npm run normalize-data` processes existing data
  - Prisma migrations add FTS GIN indexes
  - `normalizeVersion` flag set on processed items

- **Runtime**:
  - Search queries use FTS with `to_tsvector()` and `plainto_tsquery()`
  - PostgreSQL uses GIN index for candidate lookup
  - Results ranked by relevance automatically
  - API logs queries asynchronously without blocking response

### Search Query Example

When a user searches for "mountain photographer":

```sql
-- PostgreSQL FTS query with ranking
SELECT *, ts_rank(
  setweight(to_tsvector('english', suchtext), 'A') ||
  setweight(to_tsvector('english', fotografen), 'B') ||
  setweight(to_tsvector('english', bildnummer), 'C'),
  plainto_tsquery('english', 'mountain photographer')
) AS rank
FROM "Images"
WHERE (combined_tsvector) @@ plainto_tsquery('english', 'mountain photographer')
ORDER BY rank DESC, datum DESC
```

Benefits:
- Finds "mountain", "mountains", "mountainous" (word stemming)
- Prioritizes matches in `suchtext` over `fotografen`
- Uses GIN index for fast retrieval
- Returns best matches first

### Updating Index as New Items Arrive

Currently, new items should be processed through the normalization script. For continuous ingestion, an automated pipeline (queue + workers) would normalize and write updates without blocking the API.

The `normalizeVersion` field tracks which items are processed vs. pending normalization.

## New Items Every Minute Scenario

### Ingesting New Items

**Option 1: Batch Processing (Current Approach)**
- New items arrive via API/file upload
- Accumulated items processed every N minutes with normalization script
- Simpler to implement but introduces slight latency

**Option 2: Real-Time Processing (Recommended for Scale)**
- Implement message queue (e.g., Bull, RabbitMQ)
- New items trigger asynchronous normalization job
- Updated records immediately available for search
- Prevents blocking the API endpoint

### Updating Search Index

- Run normalization on new batch every 1-5 minutes
- Add new indexes for new unique values (new photographers, restrictions)
- Update `SearchLog` table to track new content categories
- Could implement incremental indexing to only process changed records

### Keeping Query Latency Low

- Use database-level indexes (already implemented)
- Cache frequently accessed photographer/restriction lists
- Add query result caching for common searches if traffic grows
- Use read replicas for search queries if needed

### Avoiding UI Blocking

- New items appear in results after next batch processing window
- Search continues on existing indexed data

## Limitations & Future Improvements

### Current Limitations

1. **Advanced Features**: No typo tolerance or synonym support (requires Elasticsearch)
2. **Scalability**: PostgreSQL FTS is strong for large datasets, but Elasticsearch becomes attractive at very large scale
3. **Personalization**: No ML-based ranking or user behavior learning
4. **Real-time Updates**: Manual batch processing for new data
5. **Analytics**: Basic search logging without deep insights

### What I Would Do Next

#### Immediate Improvements
- [x] **Implement Full-Text Search**: ✅ PostgreSQL native FTS with GIN indexes
- [x] **Add Result Ranking**: ✅ Relevance scoring with weighted fields
- [ ] **Caching Layer**: Redis for photographer/restriction lists and query results
- [ ] **Async Ingest Pipeline**: Bull/RabbitMQ for background processing
- [ ] **Result Deduplication**: Handle duplicate images from different uploads

#### Medium-term (If Scaling)
- [ ] **Elasticsearch Integration**: Replace PostgreSQL search with specialized engine
  - Better relevance scoring
  - Typo tolerance with fuzzy matching
  - Real-time indexing without batching
  - Aggregations and faceted search
  - Synonym support
- [ ] **Image Metadata Extraction**: Auto-detect tags, colors, objects in images
- [ ] **Advanced Filtering**: Image dimensions, color palettes, detected objects
- [ ] **Search Analytics Dashboard**: Track popular searches, click-through rates
- [ ] **Recommendation Engine**: "Similar images" based on metadata

#### Long-term Optimizations
- [ ] **CDN Integration**: Cache and serve images from edge locations
- [ ] **A/B Testing**: Optimize ranking algorithms based on user behavior
- [ ] **Machine Learning**: Learn from user interactions to improve relevance
- [ ] **Specialized Search UI**: Filters, facets, saved searches, search history

#### Why Elasticsearch Would Be Better
- Purpose-built for search, not general-purpose database
- Inverted indexes for sub-millisecond queries
- Native support for typo tolerance, fuzzy matching, synonyms
- Real-time indexing without batch processing
- Powerful aggregations for analytics
- Horizontal scaling through sharding
- Better ranking algorithms out of the box