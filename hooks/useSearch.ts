// useSearch hook — port từ web (src/hooks/useSearch.ts).
// Debounce 300ms; mobile bỏ AbortController, dùng cờ "request id" để chống race.
import { useCallback, useEffect, useRef, useState } from 'react';
import { API } from '@/lib/constants';
import http from '@/lib/http';
import type { ApiResultGeneric } from '@/types';

export interface UserSearchResult {
    id: number;
    name: string;
    nickName: string | null;
    avatar: string | null;
}

export interface GroupSearchResult {
    id: number;
    name: string;
    avatar: string | null;
    memberCount: number;
}

export interface SearchResult {
    users: UserSearchResult[];
    groups: GroupSearchResult[];
}

export function useSearch() {
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reqIdRef = useRef(0);

    const search = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!q.trim()) {
            setResults(null);
            setLoading(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            const myReq = ++reqIdRef.current;
            setLoading(true);
            try {
                const res = await http.get<ApiResultGeneric<SearchResult>>(API.SEARCH, { q });
                // Chỉ nhận kết quả của request mới nhất.
                if (myReq === reqIdRef.current && res?.data) setResults(res.data);
            } catch {
                // im lặng
            } finally {
                if (myReq === reqIdRef.current) setLoading(false);
            }
        }, 300);
    }, []);

    const clear = useCallback(() => {
        setResults(null);
        setLoading(false);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return { results, loading, search, clear };
}
