"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Search, TrendingUp } from "lucide-react";
import { searchCoins, getTopCoins } from "@/lib/coingecko.action";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SearchModal = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchCoin[]>([]);
  const [initialCoins, setInitialCoins] = useState<SearchCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchInitial = async () => {
      const data = await getTopCoins(10);
      setInitialCoins(data);
    };
    fetchInitial();
  }, []);

  // Handle Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = useCallback(async (val: string) => {
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await searchCoins(val);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const displayResults = query.trim() === "" ? initialCoins : results;

  const onSelect = (id: string) => {
    setOpen(false);
    router.push(`/coins/${id}`);
  };

  return (
    <div id="search-modal">
      <button className="trigger" onClick={() => setOpen(true)}>
        <Search size={20} />
        <span>Search</span>
        <kbd className="kbd">
          <span>
            {typeof window !== "undefined" &&
            navigator?.platform?.toUpperCase().indexOf("MAC") >= 0
              ? "⌘"
              : "Ctrl"}
          </span>{" "}
          K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <div className="dialog">
          <CommandInput
            placeholder="Search coins..."
            value={query}
            onValueChange={setQuery}
            className="cmd-input"
          />
          <CommandList className="list">
            {loading && (
              <div className="py-6 text-center text-sm text-purple-100">
                Searching...
              </div>
            )}

            {!loading && query.length > 0 && displayResults.length === 0 && (
              <CommandEmpty className="empty">No results found.</CommandEmpty>
            )}

            {displayResults.length > 0 && (
              <CommandGroup
                heading={
                  <div className="heading">
                    <TrendingUp size={16} />
                    <span>
                      {query.trim() === "" ? "Top 10 Coins" : "Results"}
                    </span>
                  </div>
                }
                className="group"
              >
                {displayResults.map((coin) => (
                  <CommandItem
                    key={coin.id}
                    value={coin.id} // Added value for internal cmdk consistency
                    onSelect={() => onSelect(coin.id)}
                    className="search-item"
                  >
                    <div className="coin-info">
                      <Image
                        src={coin.thumb}
                        alt={coin.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                      <div>
                        <span className="font-bold">{coin.name}</span>
                        <span className="coin-symbol">{coin.symbol}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end col-span-2 text-right">
                      {coin.market_cap_rank && (
                        <span className="text-xs text-purple-100">
                          Rank: #{coin.market_cap_rank}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </div>
      </CommandDialog>
    </div>
  );
};

export default SearchModal;
