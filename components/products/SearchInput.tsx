"use client";

import { useEffect, useState } from "react";

import { CloseIcon, SearchIcon, SpinnerIcon } from "@/components/ui/icons";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/**
 * Search box.
 *
 * The input keeps its own state so typing stays instant, and only the *debounced*
 * value is pushed up (which writes the URL, which triggers the request). Typing
 * "phone" costs one API call rather than five.
 *
 * Two directions have to stay in sync without fighting each other:
 *   - upwards: the debounced value is handed to `onCommit`. It is safe to call on
 *     mount and whenever `onCommit` changes identity, because the single writer of
 *     the URL (`setQuery`) ignores a change that would not alter the query — so an
 *     unchanged term can never push a duplicate history entry or reset the page;
 *   - downwards: a value that changed from outside — the Back button, or a "clear
 *     filters" action — is adopted back into the input *during render*, which is
 *     React's documented alternative to a synchronising effect. Using a `key`
 *     would remount the input and steal focus mid-typing.
 *
 * Note this is *not* where stale responses are prevented; that is the request-id
 * guard in `useProductsQuery`. Debouncing reduces how many requests happen, it does
 * not make them safe.
 */

interface SearchInputProps {
  /** The committed search term, read from the URL. */
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Shows a spinner while a request for the current term is in flight. */
  isBusy?: boolean;
}

export function SearchInput({
  value,
  onCommit,
  placeholder = "Search products…",
  disabled = false,
  isBusy = false,
}: SearchInputProps) {
  const [text, setText] = useState(value);
  const [lastSeenValue, setLastSeenValue] = useState(value);
  const debounced = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);

  /* Commit the debounced term upwards. */
  useEffect(() => {
    onCommit(debounced);
  }, [debounced, onCommit]);

  /* Adopt an externally changed term (Back button, Clear filters). */
  if (value !== lastSeenValue) {
    setLastSeenValue(value);
    if (text !== value) setText(value);
  }

  const handleClear = () => {
    setText("");
    // Commit immediately rather than waiting out the debounce — clearing is an
    // explicit action and should feel instantaneous.
    onCommit("");
  };

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />

      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Search products"
        enterKeyHint="search"
        // The native clear button is replaced by ours so styling stays consistent.
        className="h-11 w-full rounded-xl bg-white pr-10 pl-10 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 transition placeholder:text-slate-400 hover:ring-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 [&::-webkit-search-cancel-button]:hidden"
      />

      <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
        {isBusy && text !== "" ? (
          <SpinnerIcon className="size-4 animate-spin text-brand-500" />
        ) : null}

        {text !== "" ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            disabled={disabled}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
