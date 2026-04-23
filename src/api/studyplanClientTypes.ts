export type User = {
  id: string
  email: string
  name?: string
  role?: string
}

export type RegisterResult =
  | { kind: 'session'; user: User }
  | { kind: 'verify'; email: string; devToken?: string }
