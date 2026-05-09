export interface IStoragePort {
  upload(bucket: string, path: string, file: File): Promise<string>
  getPublicUrl(bucket: string, path: string): string
}
