import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    uniqueId: string
    role: string
  }
  interface Session {
    user: User & {
      name?: string | null
      email?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    uniqueId: string
    role: string
  }
}
