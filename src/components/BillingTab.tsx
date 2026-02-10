'use client';
import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { toast } from 'react-hot-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BillingData = Record<string, any>;

interface BillingTabProps {
  userId: string;
  billingData: BillingData;
  onBillingUpdate: (data: BillingData) => void;
}

const estadosMexico = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
  'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

const countries = [
  { code: 'MX', name: 'México' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'OTHER', name: 'Otro' }
];

// Funciones de validación
const validateRFC = (rfc: string, country: string): string | null => {
  if (country !== 'MX') return null; // No validation for other countries yet

  const rfcClean = rfc.toUpperCase().trim();
  if (!rfcClean) return null;

  if (rfcClean.length !== 12 && rfcClean.length !== 13) {
    return 'El RFC debe tener 12 caracteres (persona moral) o 13 (persona física)';
  }

  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(rfcClean)) {
    return 'El formato del RFC no es válido. Ejemplo: ABC123456XYZ';
  }

  return null;
};

const validateCP = (cp: string, country: string): string | null => {
  if (!cp) return null;
  if (country === 'MX') {
    if (!/^\d{5}$/.test(cp)) {
      return 'El código postal debe tener exactamente 5 dígitos';
    }
  }
  return null;
};

const validateTelefono = (telefono: string): string | null => {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, '');
  if (digits.length < 10) {
    return 'El teléfono debe tener al menos 10 dígitos';
  }
  return null;
};

export default function BillingTab({ userId, billingData, onBillingUpdate }: BillingTabProps) {
  const [formData, setFormData] = useState<BillingData>({
    ...billingData,
    direccion: {
      ...billingData.direccion,
      pais: billingData.direccion?.pais || 'MX'
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({
    rfc: '',
    email: '',
    telefono: '',
    codigoPostal: ''
  });

  useEffect(() => {
    setFormData({
      ...billingData,
      direccion: {
        ...billingData.direccion,
        pais: billingData.direccion?.pais || 'MX'
      }
    });
  }, [billingData]);

  // Función para verificar si hay datos fiscales
  const hasBillingData = (): boolean => {
    return !!(billingData.razonSocial && billingData.rfc);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const currentCountry = name === 'direccion.pais' ? value : formData.direccion.pais || 'Mexico';

    // Validar según el campo
    if (name === 'rfc') {
      const error = validateRFC(value, currentCountry);
      setErrors(prev => ({ ...prev, rfc: error || '' }));
    }

    if (name === 'direccion.codigoPostal') {
      const error = validateCP(value, currentCountry);
      setErrors(prev => ({ ...prev, codigoPostal: error || '' }));
    }

    if (name === 'telefono') {
      const error = validateTelefono(value);
      setErrors(prev => ({ ...prev, telefono: error || '' }));
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setErrors(prev => ({ ...prev, email: 'El formato del email no es válido' }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }

    // Actualizar formData
    if (name.includes('direccion.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        direccion: {
          ...prev.direccion,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todo antes de guardar
    const rfcError = validateRFC(formData.rfc, formData.direccion.pais || 'Mexico');
    const cpError = validateCP(formData.direccion.codigoPostal, formData.direccion.pais || 'Mexico');
    const telError = validateTelefono(formData.telefono);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailError = !emailRegex.test(formData.email) ? 'El formato del email no es válido' : '';

    // Si hay errores, mostrarlos y no continuar
    if (rfcError || cpError || telError || emailError) {
      setErrors({
        rfc: rfcError || '',
        codigoPostal: cpError || '',
        telefono: telError || '',
        email: emailError
      });
      toast.error('Por favor corrige los errores del formulario');
      return;
    }

    setIsLoading(true);

    try {
      // Crear/actualizar documento en la colección billing
      const billingRef = doc(db, 'billing', userId);
      await setDoc(billingRef, {
        ...formData,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      onBillingUpdate(formData);
      toast.success('Datos fiscales actualizados exitosamente');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error al guardar datos fiscales:', error);
      toast.error(error.message || 'Error al actualizar los datos fiscales');
    } finally {
      setIsLoading(false);
    }
  };

  const isMexico = formData.direccion.pais === 'MX';

  // Vista cuando no hay datos fiscales
  if (!hasBillingData() && !isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#0E162F] mb-2">
            No hay datos fiscales configurados
          </h3>
          <p className="text-[#3B3D45] mb-8 max-w-sm mx-auto">
            Agrega tu información fiscal para poder generar facturas para tus clientes.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-full font-medium hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar Datos Fiscales
          </button>
        </div>
      </div>
    );
  }

  // Vista cuando hay datos fiscales (modo visualización)
  if (!isEditing && hasBillingData()) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0E162F]">Datos Fiscales</h2>
              <p className="mt-1 text-sm text-[#3B3D45]">
                Información fiscal para la facturación
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar
            </button>
          </div>

          <div className="p-8">
            {/* Información Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-[#0E162F] uppercase tracking-wide mb-6 pb-2 border-b border-gray-100">
                    Información General
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">País</p>
                      <p className="text-base font-medium text-[#3B3D45] leading-relaxed">
                        {countries.find(c => c.code === formData.direccion.pais)?.name || 'México'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Razón Social</p>
                      <p className="text-base font-medium text-[#3B3D45] leading-relaxed">{formData.razonSocial}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{isMexico ? 'RFC' : 'Tax ID / EIN'}</p>
                      <p className="text-base font-medium text-[#3B3D45] font-mono leading-relaxed">{formData.rfc}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#0E162F] uppercase tracking-wide mb-6 pb-2 border-b border-gray-100">
                    Contacto
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email para Facturación</p>
                      <p className="text-base font-medium text-[#3B3D45] leading-relaxed">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Teléfono</p>
                      <p className="text-base font-medium text-[#3B3D45] leading-relaxed">{formData.telefono}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0E162F] uppercase tracking-wide mb-6 pb-2 border-b border-gray-100">
                  Dirección Fiscal
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      {isMexico ? 'Dirección Completa' : 'Address'}
                    </p>
                    <p className="text-base font-medium text-[#3B3D45] leading-relaxed max-w-sm">
                      {formData.direccion.calle}
                      {isMexico && ` ${formData.direccion.numeroExterior}`}
                      {isMexico && formData.direccion.numeroInterior && `, Int. ${formData.direccion.numeroInterior}`}
                      <br />
                      {formData.direccion.colonia && <span>{formData.direccion.colonia}<br /></span>}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        {isMexico ? 'Municipio' : 'City'}
                      </p>
                      <p className="text-base font-medium text-[#3B3D45] leading-relaxed">{formData.direccion.municipio}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        {isMexico ? 'Código Postal' : 'Zip Code'}
                      </p>
                      <p className="text-base font-medium text-[#3B3D45] leading-relaxed">{formData.direccion.codigoPostal}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      {isMexico ? 'Estado' : 'State / Province'}
                    </p>
                    <p className="text-base font-medium text-[#3B3D45] leading-relaxed">{formData.direccion.estado}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista del formulario de edición
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0E162F]">
                {hasBillingData() ? 'Editar Datos Fiscales' : 'Agregar Datos Fiscales'}
              </h2>
              <p className="mt-1 text-sm text-[#3B3D45]">
                Ingresa tu información fiscal para la facturación
              </p>
            </div>
            {/* Country Selector */}
            <div className="w-64">
              <label className="block text-xs font-medium text-gray-400 mb-1 ml-1 uppercase tracking-wider">País de Facturación</label>
              <select
                name="direccion.pais"
                value={formData.direccion.pais}
                onChange={handleInputChange}
                className="w-full h-12 px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB] appearance-none bg-white cursor-pointer"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Información General */}
            <div>
              <h3 className="text-base font-bold text-[#0E162F] mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Razón Social */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="razonSocial"
                    value={formData.razonSocial}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB]"
                    required
                    placeholder={isMexico ? "Empresa S.A. de C.V." : "Company Name LLC"}
                  />
                </div>

                {/* RFC / Tax ID */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    {isMexico ? 'RFC' : 'Tax ID / EIN'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3 border rounded-full text-sm text-[#111827] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB] ${isMexico ? 'uppercase' : ''} ${errors.rfc
                      ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-[#E5E7EB] focus:border-[#3B82F6]'
                      }`}
                    required
                    maxLength={isMexico ? 13 : 20}
                    placeholder={isMexico ? "ABC123456XYZ" : "12-3456789"}
                  />
                  {errors.rfc && (
                    <p className="mt-1 ml-1 text-sm text-red-600">{errors.rfc}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    Email para Facturación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3 border rounded-full text-sm text-[#111827] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB] ${errors.email
                      ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-[#E5E7EB] focus:border-[#3B82F6]'
                      }`}
                    required
                    placeholder="facturacion@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="mt-1 ml-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3 border rounded-full text-sm text-[#111827] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB] ${errors.telefono
                      ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-[#E5E7EB] focus:border-[#3B82F6]'
                      }`}
                    required
                    maxLength={15}
                    placeholder="5512345678"
                  />
                  {errors.telefono && (
                    <p className="mt-1 ml-1 text-sm text-red-600">{errors.telefono}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección Fiscal */}
            <div>
              <h3 className="text-base font-bold text-[#0E162F] mb-4">Dirección Fiscal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calle / Address Line 1 */}
                <div className={isMexico ? '' : 'col-span-2'}>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    {isMexico ? 'Calle' : 'Address Line 1'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="direccion.calle"
                    value={formData.direccion.calle}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB]"
                    required
                    placeholder={isMexico ? "Av. Reforma" : "123 Main St"}
                  />
                </div>

                {/* Num Exterior (Only Mexico) */}
                {isMexico && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                      Número Exterior <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="direccion.numeroExterior"
                      value={formData.direccion.numeroExterior}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB]"
                      required
                    />
                  </div>
                )}

                {/* Num Interior (Only Mexico) */}
                {isMexico && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                      Número Interior
                    </label>
                    <input
                      type="text"
                      name="direccion.numeroInterior"
                      value={formData.direccion.numeroInterior}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB]"
                    />
                  </div>
                )}

                {/* Colonia / Address Line 2 */}
                <div className={isMexico ? '' : 'col-span-2'}>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    {isMexico ? 'Colonia' : 'Address Line 2 (Optional)'} <span className={isMexico ? "text-red-500" : "hidden"}>*</span>
                  </label>
                  <input
                    type="text"
                    name="direccion.colonia"
                    value={formData.direccion.colonia}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB]"
                    required={isMexico}
                    placeholder={isMexico ? "Centro" : "Apt 4B"}
                  />
                </div>

                {/* CP / Zip Code */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    {isMexico ? 'Código Postal' : 'Zip / Postal Code'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="direccion.codigoPostal"
                    value={formData.direccion.codigoPostal}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3 border rounded-full text-sm text-[#111827] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB] ${errors.codigoPostal
                      ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-[#E5E7EB] focus:border-[#3B82F6]'
                      }`}
                    required
                    maxLength={isMexico ? 5 : 10}
                    placeholder={isMexico ? "01000" : "90210"}
                  />
                  {errors.codigoPostal && (
                    <p className="mt-1 ml-1 text-sm text-red-600">{errors.codigoPostal}</p>
                  )}
                </div>

                {/* Municipio / City */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    {isMexico ? 'Municipio/Alcaldía' : 'City'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="direccion.municipio"
                    value={formData.direccion.municipio}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB]"
                    required
                    placeholder={isMexico ? "Cuauhtémoc" : "New York"}
                  />
                </div>

                {/* Estado / State */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2 ml-1">
                    {isMexico ? 'Estado' : 'State / Province'} <span className="text-red-500">*</span>
                  </label>
                  {isMexico ? (
                    <div className="relative">
                      <select
                        name="direccion.estado"
                        value={formData.direccion.estado}
                        onChange={handleInputChange}
                        className="w-full px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB] appearance-none bg-white"
                        required
                      >
                        <option value="">Selecciona un estado</option>
                        {estadosMexico.map(estado => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="direccion.estado"
                      value={formData.direccion.estado}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 border border-[#E5E7EB] rounded-full text-sm text-[#111827] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all outline-none hover:border-[#D1D5DB]"
                      required
                      placeholder="NY"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 text-sm font-medium text-[#374151] border border-[#D1D5DB] rounded-full hover:bg-[#F9FAFB] hover:border-[#9CA3AF] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !!errors.rfc || !!errors.email || !!errors.telefono || !!errors.codigoPostal}
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-full text-sm font-medium hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
