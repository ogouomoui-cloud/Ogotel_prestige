import Link from "next/link";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessDeniedProps {
  /** Rôle requis pour accéder à la page */
  requiredRole?: string;
  /** Rôle actuel de l'utilisateur */
  userRole?: string;
  /** Message personnalisé */
  message?: string;
}

/**
 * Composant d'accès refusé — affiché quand l'utilisateur n'a pas les droits.
 * Utilisé dans les pages protégées par rôle.
 */
export function AccessDenied({
  requiredRole,
  userRole,
  message,
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <ShieldX className="h-10 w-10 text-red-500" />
      </div>

      {/* Content */}
      <h1 className="font-serif text-2xl font-semibold text-navy">
        Accès refusé
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-slate">
        {message ??
          "Vous n'avez pas les permissions nécessaires pour accéder à cette page."}
      </p>

      {/* Role details */}
      {requiredRole && (
        <div className="mt-4 rounded-lg border border-border bg-white px-4 py-3 text-center text-xs text-slate">
          {userRole && (
            <p>
              Votre rôle : <span className="font-medium text-navy">{userRole}</span>
            </p>
          )}
          <p className="mt-1">
            Rôle requis :{" "}
            <span className="font-medium text-red-600">{requiredRole}</span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="rounded-xl bg-navy text-ivory hover:bg-navy-light"
        >
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Tableau de bord
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-border hover:bg-ivory"
          onClick={() => typeof window !== "undefined" && window.history.back()}
        >
          <Link href="javascript:void(0)" onClick={() => typeof window !== "undefined" && window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>
    </div>
  );
}
