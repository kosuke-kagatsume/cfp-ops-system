"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export function usePaginated<T>(
  baseUrl: string | null,
  defaultLimit = 50
) {
  const [page, setPage] = useState(1);

  const url = useMemo(() => {
    if (!baseUrl) return null;
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}&limit=${defaultLimit}`;
  }, [baseUrl, page, defaultLimit]);

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<T>>(url);

  const onPageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    limit: defaultLimit,
    isLoading,
    error,
    mutate,
    onPageChange,
  };
}
