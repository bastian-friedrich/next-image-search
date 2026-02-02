"use client";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPaginationChange?: (data: {
    pageSize: number;
    currentPage: number;
  }) => void;
}

export default function Pagination({
  page,
  pageSize,
  totalPages,
  totalItems,
  onPaginationChange,
}: PaginationProps) {
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = Number(e.target.value);
    if (onPaginationChange) {
      onPaginationChange({ pageSize: newPageSize, currentPage: 1 });
    }
  };

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPage = Number(e.target.value);
    if (onPaginationChange) {
      onPaginationChange({ pageSize, currentPage: newPage });
    }
  };

  return (
    <div>
      <div className="bg-gray-800 rounded-lg shadow-md p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Page Size */}
          <div>
            <label
              htmlFor="page-size"
              className="block text-xs font-medium text-gray-400 mb-1"
            >
              Page Size
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-white text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          {/* Current Page */}
          <div>
            <label
              htmlFor="current-page"
              className="block text-xs font-medium text-gray-400 mb-1"
            >
              Page {page} from {totalPages}
            </label>
            <select
              id="current-page"
              value={page}
              onChange={handlePageChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-white text-sm"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <option key={pageNum} value={pageNum}>
                    Page {pageNum}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-2">
        {totalItems} items total
      </div>
    </div>
  );
}
