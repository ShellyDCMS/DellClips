"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        data-testid="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search videos or #hashtags"
        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-full
                   text-white placeholder-gray-500 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </form>
  );
}