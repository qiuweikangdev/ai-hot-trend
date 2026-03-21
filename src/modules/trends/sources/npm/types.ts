export interface NpmSearchPackagePublisher {
  username?: string
  email?: string
}

export interface NpmSearchPackageMaintainer {
  username?: string
  email?: string
}

export interface NpmSearchPackageItem {
  name: string
  scope?: string
  version: string
  description?: string
  date?: string
  keywords?: string[]
  links?: {
    npm?: string
    homepage?: string
    repository?: string
  }
  publisher?: NpmSearchPackagePublisher
  maintainers?: NpmSearchPackageMaintainer[]
}

export interface NpmSearchScoreDetail {
  quality: number
  popularity: number
  maintenance: number
}

export interface NpmSearchObject {
  package: NpmSearchPackageItem
  score: {
    final: number
    detail: NpmSearchScoreDetail
  }
}

export interface NpmSearchResponse {
  objects: NpmSearchObject[]
}

export interface NpmDownloadsPointItem {
  downloads: number
  start: string
  end: string
  package: string
}

export type NpmDownloadsPointResponse
  = | NpmDownloadsPointItem
    | Record<string, NpmDownloadsPointItem>
