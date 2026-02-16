// Aloe - RWA page (deprecated)
// Redirects to /dashboard — RWA module removed in auction primitive pivot

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function RWAExchange() {
  const router = useRouter();

  // Redirect to dashboard on mount
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
