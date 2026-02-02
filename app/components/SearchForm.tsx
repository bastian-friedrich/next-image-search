"use client";

import type React from "react";

interface SearchFormProps {
  credits: string[];
  restrictions: string[];
  onSubmit?: (data: Record<string, any>) => void;
}

export default function SearchForm({
  credits,
  restrictions,
  onSubmit,
}: SearchFormProps) {
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData);

    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm p-4 space-y-3"
    >
      {/* Line 1: Search input */}
      <div>
        <input
          id="search-query"
          type="text"
          name="q"
          placeholder="Search images..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />
      </div>

      {/* Line 2: All filters + sorting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Credit */}
        <div>
          <label
            htmlFor="credit"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Credit
          </label>
          <select
            id="credit"
            name="credit"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
          >
            <option value="">Select...</option>
            {credits.map((credit) => (
              <option key={credit} value={credit}>
                {credit}
              </option>
            ))}
          </select>
        </div>

        {/* Restrictions */}
        <div>
          <label
            htmlFor="restrictions"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Restrictions
          </label>
          <select
            id="restrictions"
            name="restrictions"
            multiple
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
          >
            {restrictions.map((restriction) => (
              <option key={restriction} value={restriction}>
                {restriction}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label
            htmlFor="date-from"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Date From
          </label>
          <input
            id="date-from"
            type="date"
            name="dateFrom"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
          />
        </div>

        {/* Date To */}
        <div>
          <label
            htmlFor="date-to"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Date To
          </label>
          <input
            id="date-to"
            type="date"
            name="dateTo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label
            htmlFor="sort"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue="desc"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Line 3: Submit button */}
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
      >
        Search
      </button>
    </form>
  );
}
