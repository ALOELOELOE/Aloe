// Aloe - OTC page (deprecated)
// Redirects to /dashboard — OTC module removed in auction primitive pivot

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function OTC() {
  const router = useRouter();

  // Redirect to dashboard on mount
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
