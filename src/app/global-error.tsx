"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-10 w-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-navy">
              Une erreur est survenue
            </h1>
            <p className="mt-3 text-sm text-slate">
              Une erreur inattendue s&apos;est produite. Veuillez réessayer
              ou contacter le support si le problème persiste.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => reset()}
                className="rounded-xl bg-navy px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-navy-light transition-colors"
              >
                Réessayer
              </button>
              <a
                href="/connexion"
                className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-navy hover:bg-muted transition-colors"
              >
                Retour à la connexion
              </a>
            </div>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-6 max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-800">
                {error.message}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
