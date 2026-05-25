export type { AuthResult, AuthResultWithError } from "./types";
export {
  getUser,
  signInWithEmail,
  signOut,
  onAuthStateChange,
} from "./client";
export {
  getServerUser,
  requireServerUser,
  getServerProfile,
  requireServerProfile,
} from "./server";
