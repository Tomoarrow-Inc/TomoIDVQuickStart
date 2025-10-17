export interface AssertionConfig {
  privateKey: string; // base64Url 인코딩된 JWK private key
  clientId: string;
}

export interface TokenResponseBody {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  scopeGranted?: string;
}

export interface IssueAccessTokenResult {
  clientId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string | null;
  claims?: Record<string, unknown>;
}

export interface UseAssertionProps {
  onAssertionCreated?: (assertion: string) => void;
  onError?: (error: Error) => void;
}

export interface UseAssertionReturn {
  createClientAssertion: (config: AssertionConfig) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}
