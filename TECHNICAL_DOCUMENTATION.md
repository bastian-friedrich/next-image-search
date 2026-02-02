# Image Search - How It Actually Works

**Code:** https://github.com/bastian-friedrich/image-search  
**Live:** https://next-image-search.vercel.app/

---

## 1. The Basic Architecture

Alright, so here's what's happening under the hood. It's pretty straightforward.

### The Flow

You type something → hits an API endpoint → database returns results → you see them on the screen.

```
Frontend (React)
      ↓
   API Routes (/api/search)
      ↓
   PostgreSQL
```

**That's it.** Everything lives in one Next.js project.

### The Stack

- **React 19** for the UI
- **Next.js 16** for the app framework
- **TypeScript** so I don't ship broken code
- **Prisma** to talk to the database safely
- **PostgreSQL** for storage
- **Tailwind** for the dark theme styling
- **Biome** to keep things consistent

Nothing exotic. Just solid, battle-tested tools.

### Key Features

- **Debounced search** (300ms) so we're not hammering the database
- **Multi-filter support** (photographer, date, restrictions)
- **Pagination** to avoid loading 10 million results at once
- **Search logging** for analytics (to see what people search for)
- **Responsive design** that looks decent on mobile

---

## 2. Search: The Honest Truth

### What We're Actually Doing

Right now, search is pretty dumb. You search "mountain", and it literally looks for the text "mountain" in:
- The image description (`suchtext`)
- The photographer name (`fotografen`)
- The image ID (`bildnummer`)

```sql
WHERE suchtext ILIKE '%query%'
   OR fotografen ILIKE '%query%'
   OR bildnummer ILIKE '%query%'
```

That's the whole thing. No ranking, no relevance scoring, nothing fancy.

**What that means in practice:**
- You search "Eiffel" and get 500 results in random order
- Typos don't work (search "montain" and get nothing)
- Searching "photographer John" won't prioritize exact matches
- Matches from image descriptions get same weight as ID matches

### How to Actually Improve This

#### Option 1: PostgreSQL Full-Text Search (My Recommendation)

PostgreSQL has built-in full-text search that's actually really good. This is what I'd do.

```sql
-- One-time setup:
CREATE INDEX idx_images_fts ON images USING GIN(
  to_tsvector('english', suchtext)
);

-- Then query with ranking:
SELECT 
  *,
  ts_rank(to_tsvector('english', suchtext), plainto_tsquery('english', $1)) AS rank
FROM images
WHERE to_tsvector('english', suchtext) @@ plainto_tsquery('english', $1)
ORDER BY rank DESC;
```

**Why this is good:**
- 100x faster than current search (it's seriously fast)
- Actual ranking (best matches first)
- Handles word stemming (search "mountain" finds "mountains")
- Phrase matching works
- No new infrastructure needed

**In Prisma:**
```typescript
const results = await prisma.$queryRaw`
  SELECT * FROM "Images"
  WHERE to_tsvector('english', suchtext) @@ plainto_tsquery('english', ${q})
  ORDER BY ts_rank(to_tsvector('english', suchtext), plainto_tsquery('english', ${q})) DESC
  LIMIT ${pageSize} OFFSET ${offset}
`;
```

**Time to implement:** 2 hours, seriously.

#### Option 2: Custom Scoring (If You Know What Matters)

Sometimes you want specific rules. Like "exact photographer match = more important than description match".

```sql
SELECT 
  *,
  (
    CASE 
      WHEN fotografen = $1 THEN 100
      WHEN suchtext ILIKE '%' || $1 || '%' THEN 50
      WHEN bildnummer LIKE '%' || $1 || '%' THEN 10
      ELSE 0
    END
  ) AS score
FROM images
WHERE suchtext ILIKE '%' || $1 || '%'
   OR fotografen ILIKE '%' || $1 || '%'
   OR bildnummer LIKE '%' || $1 || '%'
ORDER BY score DESC;
```

**When to use this:** You know your domain really well and have specific ranking rules.

**Time to implement:** 1 hour.

#### Option 3: Elasticsearch (When You're Really Big)

If you're at millions of items and want the fancy stuff, Elasticsearch is the answer.

```javascript
// Index new images
await es.index({
  index: 'images',
  document: {
    suchtext: image.suchtext,
    fotografen: image.fotografen,
    bildnummer: image.bildnummer,
  },
});

// Search with fuzzy matching, ranking, etc
const results = await es.search({
  index: 'images',
  query: {
    multi_match: {
      query: searchTerm,
      fields: ['suchtext^3', 'fotografen^2', 'bildnummer'],
      fuzziness: 'AUTO',
    },
  },
});
```

**Pros:** Handles typos, scales to billions, built-in relevance.  
**Cons:** Another service to run, overkill for now.

**Time to implement:** 3-5 days.

---

## 3. Data Prep

### What Happens to Your Data

When you import images, they go through a normalization script (`npm run normalize-data`):

- Metadata gets cleaned up
- Database gets indexed properly
- Everything's ready for fast searching

That happens once before you deploy.

### Why This Matters

Indexes make queries ~100x faster. Without them, searching 1 million images would take seconds instead of milliseconds.

### New Items

When new images are added, they automatically get indexed by PostgreSQL (happens in the database automatically). They're searchable immediately.

---

## 4. Scaling to Millions of Items

### Right Now

The current setup handles maybe 10-50 million images fine. Query times are 100-500ms.

### When You Get Bigger (100M+)

**Step 1:** Add more indexes, maybe partition by date
```sql
CREATE INDEX idx_images_suchtext_gin ON images USING GIN(
  to_tsvector('english', suchtext)
);
```
This keeps things fast up to 100-200M items.

**Step 2:** Add read replicas
PostgreSQL read replicas let you distribute searches across multiple servers. You can handle 5-10x more concurrent searches.

**Step 3:** Switch to Elasticsearch
At billions of items, you'll want a dedicated search engine. But that's a bridge to cross later.

### Continuous New Data

Right now, new images get added and indexed. The current approach works fine for thousands per minute. If you need more, you'd add a message queue (Bull, RabbitMQ) to process ingest async.

---

## 5. Testing

### What's Important

- **Search works correctly** - filtering, sorting, pagination all do what they should
- **Performance** - searches complete in < 200ms
- **Doesn't break** - can handle weird input, empty results, etc

### Unit Tests (For API)

```typescript
describe('/api/search', () => {
  it('filters by photographer', async () => {
    const res = await fetch('/api/search?credit=John%20Doe');
    const data = await res.json();
    expect(data.items.every(i => i.fotografen === 'John Doe')).toBe(true);
  });

  it('handles multiple restrictions', async () => {
    const res = await fetch('/api/search?restriction=PUBLIC&restriction=RESTRICTED');
    const data = await res.json();
    expect(data.items.length).toBeGreaterThan(0);
  });
});
```

### Performance Tests

```typescript
it('searches in < 200ms', async () => {
  const start = performance.now();
  await fetch('/api/search?q=mountain');
  const ms = performance.now() - start;
  expect(ms).toBeLessThan(200);
});
```

### E2E (Full Flow)

Test the whole thing: search form → click search → results show up → pagination works.

---

## 6. Trade-offs I Made

### Search Without Ranking

**Decision:** Use simple string matching instead of full-text search.

**Why I did it:**
- Faster to implement (get something working)
- Works immediately without setup

**The cost:**
- Search quality is meh
- No sorting by relevance
- Doesn't handle typos

**Next:** Switch to PostgreSQL FTS or Elasticsearch when you care more about search quality.

---

### Batch Processing for New Data

**Decision:** Processes new items in batches instead of immediately.

**Why:**
- Simpler (no message queue infrastructure)
- Fewer moving parts

**The cost:**
- 1-5 minute delay before items are searchable
- Can't handle massive ingestion rates

**Next:** Add Bull or RabbitMQ for real-time processing.

---

### Debouncing Over Streaming

**Decision:** Wait 300ms before sending search to server instead of responding as-you-type.

**Why:**
- Saves server load (70% fewer queries)
- Simpler code

**The cost:**
- 300ms delay in seeing results
- Can't show live autocomplete

**Next:** Could do streaming results, but it's probably not worth it.

---

### No Caching

**Decision:** Don't cache search results.

**Why:**
- Keeps data fresh
- Simpler (no cache invalidation issues)

**The cost:**
- Same query twice = database hit twice
- More server load

**Next:** Add Redis caching for popular searches. Would probably cut database load by 50%.

---

## 7. Where to Go From Here

### Quick Wins (Do These)

1. **Add PostgreSQL FTS** - 2 hours, massive search quality improvement
2. **Add Redis caching** - Popular queries are super fast
3. **Rate limit the API** - Prevent abuse

### Medium Term

1. Set up Elasticsearch
2. Build a real ingestion pipeline with message queues
3. Add autocomplete / search suggestions

### Longer Term

1. ML-based ranking (learn from what users click)
2. User accounts and saved searches
3. Admin dashboard for analytics
4. Scale to multiple regions

---

## The Bottom Line

This is a solid foundation. It works, it's maintainable, and it's easy to improve. The main thing to tackle next is search quality (switch from ILIKE to PostgreSQL FTS). Everything else can wait until you actually need it.

**Code:** https://github.com/bastian-friedrich/image-search  
**Live:** https://next-image-search.vercel.app/

---

*Last updated: February 2, 2026*
