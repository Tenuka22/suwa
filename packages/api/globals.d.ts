export type Roles =
  | "admin"
  | "doctor"
  | "user"
  | "pending-doctor"
  | "tenant-admin";

interface CustomJwtSessionClaimsMetadata {
  email?: string;
  image_url?: string;
  name?: string;
  phone?: string;
  role?: Roles;
}

declare global {
  interface CustomJwtSessionClaims {
    metadata: CustomJwtSessionClaimsMetadata;
  }
}
