export interface GithubRepoSearchItem {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  created_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

export interface GithubRepoSearchResponse {
  items: GithubRepoSearchItem[]
}
