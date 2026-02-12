"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SearchResult {
    flona_name: string;
    image: string | null;
    bio: string | null;
}

export default function UserSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (query.length < 3) {
            setResults([]);
            return;
        }

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        setLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 500); // Debounce delay

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        }
    }, [query]);

    return (
        <div className="relative max-w-md w-full">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-4 py-2 pl-10 bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm text-gray-900"
                />
                <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {(results.length > 0 || loading) && query.length >= 3 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[60]">
                    {loading ? (
                        <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {results.map((user) => (
                                <li key={user.flona_name}>
                                    <Link
                                        href={`/profile/${user.flona_name}`}
                                        className="block p-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                    >
                                        {user.image ? (
                                            <Image
                                                src={user.image}
                                                alt={user.flona_name}
                                                width={40}
                                                height={40}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                                                {user.flona_name[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-black">{user.flona_name}</div>
                                            <div className="text-xs text-gray-700 line-clamp-1">{user.bio || 'No bio'}</div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                            {results.length === 0 && !loading && (
                                <div className="p-4 text-center text-gray-400 text-sm">No users found</div>
                            )}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
