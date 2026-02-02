"use client";

import { useState } from "react";
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
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFormSubmit = (data: Record<string, any>) => {
    console.log("Form submitted with data:", data);
  };

  const handlePaginationChange = (data: {
    pageSize: number;
    currentPage: number;
  }) => {
    console.log("Pagination changed:", data);
    setPageSize(data.pageSize);
    setCurrentPage(data.currentPage);
  };

  // Dummy values for now
  const totalPages = 100;
  const totalItems = 4567;

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
