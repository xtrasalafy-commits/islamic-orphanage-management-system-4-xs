"use client";

import useSWR from "swr";
import { fetcher, SWR_CONFIG } from "@/lib/api";
import type { SafeUser } from "@/lib/types";

export function useCurrentUser(): SafeUser | null {
  const { data } = useSWR<{ user: SafeUser }>("/api/auth/me", fetcher, SWR_CONFIG);
  return data?.user ?? null;
}
