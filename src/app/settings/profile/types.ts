export interface BillingData {
  razonSocial: string;
  rfc: string;
  direccion: {
    calle: string;
    numeroExterior: string;
    numeroInterior: string;
    colonia: string;
    codigoPostal: string;
    municipio: string;
    estado: string;
    pais?: string;
  };
  email: string;
  telefono: string;
}

export interface BrandingData {
  nombreDespacho: string;
  slogan?: string;
  anoFundacion?: string;
  descripcion?: string;
  colores: {
    primario: string;
    secundario: string;
    terciario: string;
  };
  logoURL?: string;
  signatureBlock?: string;
  signatureURL?: string; // Digital signature image (autograph)
  logoURLDark?: string;  // Logo for dark backgrounds
  logoURLLight?: string; // Logo for light backgrounds
  tipografia?: {
    encabezados: string; // Google Font for headings
    cuerpo: string;      // Google Font for body text
  };
}
