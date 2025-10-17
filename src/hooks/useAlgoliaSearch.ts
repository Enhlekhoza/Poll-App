'use client';

import { useState, useEffect } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { Poll } from '@/types/index';

// Initialize Algolia client
const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);
const index = client.initIndex('polls');

export function useAlgoliaSearch(query: string) {
  const [searchResults, setSearchResults] = useState<Poll[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // If query is empty, reset results
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    index
      .search(query, { hitsPerPage: 20 }) // fetch up to 20 results
      .then(({ hits }) => {
        // Map Algolia hits to Poll type
        const results: Poll[] = hits.map((hit: any) => ({
          id: hit.objectID,
          title: hit.title || '',
          description: hit.description || '',
          options: hit.options || [],
          authorId: hit.authorId || '',
          createdAt: hit.createdAt ? new Date(hit.createdAt) : new Date(),
        }));
        setSearchResults(results);
      })
      .catch((err) => {
        console.error('Algolia search error:', err);
        setSearchResults([]);
      })
      .finally(() => setSearching(false));
  }, [query]);

  return { searchResults, searching };
}