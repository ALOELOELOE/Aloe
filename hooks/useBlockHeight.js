// Hook to fetch and track the current Aleo block height
// Used by AuctionTimer and phase detection throughout the app

import { useState, useEffect } from "react";
import { ALEO_API_URL, NETWORK, BLOCK_TIME_SECONDS } from "@/lib/constants";

/**
 * Fetches the current block height from the Aleo network
 * Polls every BLOCK_TIME_SECONDS to stay roughly in sync
 * @returns {{ currentBlock: number|null, isLoading: boolean, error: string|null }}
 */
export function useBlockHeight() {
  const [currentBlock, setCurrentBlock] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlockHeight = async () => {
      try {
        const res = await fetch(`${ALEO_API_URL}/${NETWORK}/block/height/latest`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const height = await res.json();
        console.log("[Aloe:useBlockHeight] Current block height:", height);
        setCurrentBlock(height);
        setError(null);
      } catch (err) {
        console.error("[Aloe:useBlockHeight] Failed to fetch block height:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchBlockHeight();

    // Poll every block interval to keep in sync
    const interval = setInterval(fetchBlockHeight, BLOCK_TIME_SECONDS * 1000);
    return () => clearInterval(interval);
  }, []);

  return { currentBlock, isLoading, error };
}

export default useBlockHeight;
