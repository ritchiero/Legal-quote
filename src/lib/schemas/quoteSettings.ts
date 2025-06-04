export interface SignerInfo {
  name: string;
  role: string;
  phone?: string;
  email: string;
  other?: string;
}

export interface QuoteBranding {
  firmName: string;
  tagline?: string;
  sinceYear?: number;
  description: string;
  website?: string;
  palette: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  signer: SignerInfo;
}

export function validateQuoteSettings(data: QuoteBranding): boolean {
  if (!data.signer.name || data.signer.name.length < 3) return false;
  if (!data.signer.role || data.signer.role.length < 3) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.signer.email)) return false;
  return true;
}
