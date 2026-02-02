"use client";

import SearchForm from "./SearchForm";

interface SearchContainerProps {
  credits: string[];
  restrictions: string[];
}

export default function SearchContainer({
  credits,
  restrictions,
}: SearchContainerProps) {
  const handleFormSubmit = (data: Record<string, any>) => {
    console.log("Form submitted with data:", data);
  };

  return (
    <SearchForm
      credits={credits}
      restrictions={restrictions}
      onSubmit={handleFormSubmit}
    />
  );
}
