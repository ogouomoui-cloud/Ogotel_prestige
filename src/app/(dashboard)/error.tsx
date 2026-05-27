"use client";

import { useEffect } from "react";
import { PageError } from "@/components/shared/PageError";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <PageError
      message="Une erreur est survenue lors du chargement du tableau de bord. Veuillez réessayer."
      onRetry={reset}
    />
  );
}
