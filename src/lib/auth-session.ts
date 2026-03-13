export interface AuthSessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface AuthSessionSnapshot {
  user: AuthSessionUser
}
