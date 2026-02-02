"use client";

import { useState, useEffect, useRef } from "react";
import SearchForm from "./SearchForm";
import Pagination from "./Pagination";
import ResultsGrid from "./ResultsGrid";

interface SearchContainerProps {
  credits: string[];
  restrictions: string[];
}

export default function SearchContainer({
  credits,
  restrictions,
}: SearchContainerProps) {
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFormSubmit = (data: Record<string, any>) => {
    console.log("Form submitted with data:", data);
    setFilters(data);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePaginationChange = (data: {
    pageSize: number;
    currentPage: number;
  }) => {
    console.log("Pagination changed:", data);
    setPageSize(data.pageSize);
    setCurrentPage(data.currentPage);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch data when filters or pagination changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      // Add filter params if they exist
      if (filters.q) params.append("q", filters.q);
      if (filters.credit) params.append("credit", filters.credit);
      if (Array.isArray(filters.restrictions)) {
        filters.restrictions.forEach((restriction: string) => {
          if (restriction) params.append("restriction", restriction);
        });
      } else if (filters.restrictions) {
        params.append("restriction", filters.restrictions);
      }
      if (filters.dateFrom) params.append("date", filters.dateFrom);
      if (filters.sort) params.append("sort", filters.sort);

      try {
        const response = await fetch(`/api/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();

        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
        setResults(data.items || []);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch results",
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      <SearchForm
        credits={credits}
        restrictions={restrictions}
        onSubmit={handleFormSubmit}
      />
      <ResultsGrid
        items={results}
        isLoading={isLoading}
        error={error}
        searchQuery={filters.q}
      />
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        totalItems={totalItems}
        onPaginationChange={handlePaginationChange}
      />
    </div>
  );
}
