"use server";

import qs from "query-string";

const BASE_URL = process.env.COINGECKO_BASE_URL!;
const API_KEY = process.env.COINGECKO_API_KEY!;

if (!BASE_URL || !API_KEY) {
  throw new Error("Missing environment variables");
}

export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60
): Promise<T> {
  const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const url = qs.stringifyUrl(
    {
      url: `${baseUrl}${cleanEndpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true }
  );

  const isDemoKey = API_KEY.startsWith("CG-");
  const headerKey = isDemoKey ? "x-cg-demo-api-key" : "x-cg-pro-api-key";

  const response = await fetch(url, {
    headers: {
      [headerKey]: API_KEY,
      "Content-Type": "application/json",
    } as Record<string, string>,
    next: { revalidate },
  });

  if (!response.ok) {
    const errorBody: CoinGeckoErrorBody = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      `API Error: ${response.status}: ${
        errorBody.error || response.statusText
      } `
    );
  }

  return response.json();
}

export async function getPools(
  id: string,
  network?: string | null,
  contractAddress?: string | null
): Promise<PoolData> {
  const fallback: PoolData = {
    id: "",
    address: "",
    name: "",
    network: "",
  };

  if (network && contractAddress) {
    try {
      const poolData = await fetcher<{ data: PoolData[] }>(
        `/onchain/networks/${network}/tokens/${contractAddress}/pools`
      );

      return poolData.data?.[0] ?? fallback;
    } catch (error) {
      console.log(error);
      return fallback;
    }
  }

  try {
    const poolData = await fetcher<{ data: PoolData[] }>(
      "/onchain/search/pools",
      { query: id }
    );

    return poolData.data?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export async function searchCoins(query: string): Promise<SearchCoin[]> {
  if (!query) return [];

  try {
    const response = await fetcher<{ coins: SearchCoin[] }>("/search", {
      query: query,
    });

    return response.coins || [];
  } catch (error) {
    console.error("Search API Error:", error);
    return [];
  }
}

export async function getTopCoins(limit = 10): Promise<SearchCoin[]> {
  try {
    const response = await fetcher<CoinMarketData[]>("/coins/markets", {
      vs_currency: "inr",
      order: "market_cap_desc",
      per_page: limit,
      page: 1,
      sparkline: false,
    });

    return response.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      market_cap_rank: coin.market_cap_rank,
      thumb: coin.image,
      large: coin.image,
      data: {
        price_change_percentage_24h: coin.price_change_percentage_24h,
      },
    }));
  } catch (error) {
    console.error("fetch top coins error", error);
    return [];
  }
}
