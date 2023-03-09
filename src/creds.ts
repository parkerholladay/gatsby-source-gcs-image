import type { CredentialBody as GcpCredentials } from 'google-auth-library'

export { GcpCredentials }

export type Credentials = {
  bucketName?: string
  gcp: GcpCredentials
  projectId?: string
}
export function parseCredentials(credsJson?: string, pathToCreds?: string): Credentials | null {
  const gcpConfig = ((credsJson ? JSON.parse(credsJson) : undefined)
    ?? (pathToCreds ? require(pathToCreds) : undefined))

  return gcpConfig
    ? {
      bucketName: gcpConfig?.bucket_name,
      gcp: gcpConfig,
      projectId: gcpConfig?.project_id,
    }
    : null
}
