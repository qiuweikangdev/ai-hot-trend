export interface AuthSessionUser {
  id: string
  username?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface AuthSessionSnapshot {
  user: AuthSessionUser | null
}
