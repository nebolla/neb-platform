import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    partnerId: string
    role: "PARTNER" | "ADMIN" | "SUPER_ADMIN"
  }
  interface Session {
    user: User
  }
}
