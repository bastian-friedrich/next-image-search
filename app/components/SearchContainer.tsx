"use client";

import { useState, useEffect } from "react";
import SearchForm from "./SearchForm";
import Pagination from "./Pagination";

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
  };

  // Fetch data when filters or pagination changes
  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      // Add filter params if they exist
      if (filters.q) params.append("q", filters.q);
      if (filters.credit) params.append("credit", filters.credit);
      if (filters.restrictions)
        params.append("restriction", filters.restrictions);
      if (filters.dateFrom) params.append("date", filters.dateFrom);
      if (filters.sort) params.append("sort", filters.sort);

      try {
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();

        console.log("Search results:", data);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    fetchData();
  }, [filters, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      <SearchForm
        credits={credits}
        restrictions={restrictions}
        onSubmit={handleFormSubmit}
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
