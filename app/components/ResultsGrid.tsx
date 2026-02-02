interface ResultItem {
  id: number;
  bildnummer: string;
  fotografen: string;
  datum: string | Date;
  suchtext: string;
}

interface ResultsGridProps {
  items: ResultItem[];
  isLoading?: boolean;
  error?: string | null;
  searchQuery?: string;
}

// Helper function to highlight search query in text
function highlightText(text: string, query?: string) {
  if (!query || !text) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <span key={index} className="bg-yellow-600 text-white font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function ResultsGrid({
  items,
  isLoading,
  error,
  searchQuery,
}: ResultsGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
          <p className="text-gray-400 text-sm">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div className="flex flex-col items-center space-y-3">
          <svg
            className="w-12 h-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Error icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-400 font-medium">Error loading results</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div className="flex flex-col items-center space-y-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>No results icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-400 font-medium">No results found</p>
          <p className="text-gray-500 text-sm">
            Try adjusting your search filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Fake image placeholder */}
          <div className="bg-gray-700 aspect-square flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">Bildnummer</div>
              <div className="text-white text-sm font-mono font-semibold">
                {item.bildnummer}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-3 space-y-2">
            <div>
              <div className="text-xs text-gray-400 font-medium">Suchtext</div>
              <div className="text-sm text-gray-200">
                {highlightText(item.suchtext, searchQuery)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">
                Fotografen
              </div>
              <div className="text-sm text-gray-200">{item.fotografen}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Datum</div>
              <div className="text-sm text-gray-200">
                {new Date(item.datum).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
