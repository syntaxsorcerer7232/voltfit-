import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { globalLocalAudioTracks } from '../utils/audio';

export type SearchResultType = 'user' | 'local_audio' | 'spotify_track';

export interface UnifiedSearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: SearchResultType;
  imageUrl?: string;
  metadata?: any;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: UnifiedSearchResult[];
  isSearching: boolean;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = searchQuery;
    if (!q || q.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      setSearchResults([]);
      const results: UnifiedSearchResult[] = [];

      // 1. Search Local Audio
      const term = q.toLowerCase();
      const localMatches = globalLocalAudioTracks
        .filter(t => t.name.toLowerCase().includes(term))
        .map((t, index) => ({
          id: `local_${t.id || index}`,
          title: t.name,
          subtitle: 'Local Audio',
          type: 'local_audio' as SearchResultType,
          metadata: { track: t, index }
        }));
      results.push(...localMatches);

      // 2. Search Firestore Users
      try {
        const usersRef = collection(db, 'public_profiles');
        const nameQuery = query(
          usersRef,
          where('name', '>=', q),
          where('name', '<=', q + '\uf8ff'),
          limit(5)
        );
        const snapshot = await getDocs(nameQuery);
        const userMatches = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: `user_${doc.id}`,
            title: data.name || 'Unknown User',
            subtitle: 'Community Member',
            type: 'user' as SearchResultType,
            imageUrl: data.profilePicture,
            metadata: { userId: doc.id, ...data }
          };
        });
        results.push(...userMatches);
      } catch (err) {
        console.warn("Firestore search failed:", err);
      }

      // 3. Search Spotify API
      try {
        const token = localStorage.getItem('spotify_token');
        if (token) {
          const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.tracks && data.tracks.items) {
              const spotifyMatches = data.tracks.items.map((track: any) => ({
                id: `spotify_${track.id}`,
                title: track.name,
                subtitle: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
                type: 'spotify_track' as SearchResultType,
                imageUrl: track.album?.images?.[0]?.url,
                metadata: { track }
              }));
              results.push(...spotifyMatches);
            }
          }
        }
      } catch (err) {
        console.warn("Spotify search failed:", err);
      }

      setSearchResults(results);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, searchResults, isSearching, performSearch, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useUnifiedSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useUnifiedSearch must be used within a SearchProvider');
  }
  return context;
};
