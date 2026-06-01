"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { searchUsers, sendFriendRequest } from "@/actions/friends";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FriendProfile } from "@/lib/friends/queries";

export function FriendSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [acting, startAct] = useTransition();

  const runSearch = useCallback((q: string) => {
    startSearch(async () => {
      const { users, error: searchError } = await searchUsers(q);
      setResults(users);
      setError(searchError ?? null);
    });
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;

    const timer = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const canSearch = query.trim().length >= 2;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Find people</h2>
        <p className="text-sm text-muted">Search by username or display name.</p>
      </div>
      <Input
        type="search"
        placeholder="Search username…"
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          if (next.trim().length < 2) {
            setResults([]);
            setError(null);
          }
        }}
        aria-label="Search users"
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {searching && canSearch ? (
        <p className="text-sm text-muted">Searching…</p>
      ) : null}
      {canSearch && results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((profile) => {
            const displayName = profile.display_name || profile.username;
            return (
              <li
                key={profile.user_id}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
              >
                <Link
                  href={`/u/${profile.username}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{displayName}</p>
                    <p className="text-sm text-muted">@{profile.username}</p>
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={acting}
                  onClick={() => {
                    startAct(async () => {
                      const result = await sendFriendRequest(profile.user_id);
                      if (result.error) {
                        setError(result.error);
                      } else {
                        setError(null);
                        router.refresh();
                      }
                    });
                  }}
                >
                  Add friend
                </Button>
              </li>
            );
          })}
        </ul>
      ) : canSearch && !searching ? (
        <p className="text-sm text-muted">No users found.</p>
      ) : null}
    </section>
  );
}
