import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface PageErrorProps {
  /** Message d'erreur à afficher */
  message?: string;
  /** Titre personnalisé */
  title?: string;
  /** Action de retry personnalisée */
  onRetry?: () => void;
  /** Masquer le bouton de retry */
  hideRetry?: boolean;
}

/**
 * Composant d'erreur standard pour les pages dashboard.
 * Design cohérent avec OGOTEL Prestige.
 */
export function PageError({
  message = "Une erreur inattendue s'est produite. Veuillez réessayer.",
  title = "Erreur de chargement",
  onRetry,
  hideRetry = false,
}: PageErrorProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md rounded-2xl border-border shadow-sm">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>

          {/* Text */}
          <h2 className="font-serif text-lg font-semibold text-navy">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate">{message}</p>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {!hideRetry && (
              <Button
                onClick={onRetry ?? (() => window.location.reload())}
                className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-border hover:bg-ivory"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Tableau de bord
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
