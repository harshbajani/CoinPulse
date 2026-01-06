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
