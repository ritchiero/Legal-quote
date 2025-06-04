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
  };
  email: string;
  telefono: string;
}

export interface BrandingData {
  nombreDespacho: string;
  slogan?: string;
  anoFundacion?: string;
  descripcion?: string;
  sitioWeb?: string;
  redes?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  colores: {
    primario: string;
    secundario: string;
    terciario: string;
  };
  logoURL?: string;
  signer: {
    name: string;
    role: string;
    phone?: string;
    email: string;
    other?: string;
  };
}
