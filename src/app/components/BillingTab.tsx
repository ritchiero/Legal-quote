'use client';
import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { toast } from 'react-hot-toast';

// Actualizar la interfaz BillingData para quitar regimenFiscal
export interface BillingData {
  razonSocial: string;
  rfc: string;
  email: string;
  telefono: string;
  direccion: {
    calle: string;
    numeroExterior: string;
    numeroInterior: string;
    colonia: string;
    codigoPostal: string;
    municipio: string;
    estado: string;
  };
}

interface BillingTabProps {
  userId: string;
  billingData: BillingData;
  onBillingUpdate: (data: BillingData) => void;
}

const estados = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
  'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

export default function BillingTab({ userId, billingData, onBillingUpdate }: BillingTabProps) {
  const [formData, setFormData] = useState<BillingData>(billingData);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFormData(billingData);
  }, [billingData]);

  // Función para verificar si hay datos fiscales
  const hasBillingData = (): boolean => {
    return !!(billingData.razonSocial && billingData.rfc);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
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
    setIsLoading(true);

    try {
      // Validar RFC
      const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;
      if (!rfcRegex.test(formData.rfc.toUpperCase())) {
        throw new Error('El formato del RFC no es válido');
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('El formato del email no es válido');
      }

      // Validar código postal
      if (!/^\d{5}$/.test(formData.direccion.codigoPostal)) {
        throw new Error('El código postal debe tener 5 dígitos');
      }

      // Validar teléfono (10 dígitos)
      if (!/^\d{10}$/.test(formData.telefono)) {
        throw new Error('El teléfono debe tener 10 dígitos');
      }

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

  // Vista cuando no hay datos fiscales
  if (!hasBillingData() && !isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Datos Fiscales</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configura tu información fiscal para la facturación
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No hay datos fiscales configurados
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
                Agrega tu información fiscal para poder generar facturas para tus clientes
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Datos Fiscales
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista cuando hay datos fiscales (modo visualización)
  if (!isEditing && hasBillingData()) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Datos Fiscales</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Información fiscal para la facturación
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editar
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Información Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Información General</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Razón Social</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.razonSocial}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">RFC</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.rfc}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Contacto</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Email para Facturación</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.telefono}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Dirección Fiscal</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Dirección Completa</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {formData.direccion.calle} {formData.direccion.numeroExterior}
                      {formData.direccion.numeroInterior && `, Int. ${formData.direccion.numeroInterior}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Colonia</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.direccion.colonia}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Código Postal</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.direccion.codigoPostal}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Municipio</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.direccion.municipio}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.direccion.estado}</p>
                    </div>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {hasBillingData() ? 'Editar Datos Fiscales' : 'Agregar Datos Fiscales'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ingresa tu información fiscal para la facturación
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Información General */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Razón Social */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    name="razonSocial"
                    value={formData.razonSocial}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* RFC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email para Facturación
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* Dirección Fiscal */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Dirección Fiscal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calle
                  </label>
                  <input
                    type="text"
                    name="direccion.calle"
                    value={formData.direccion.calle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Número Exterior */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número Exterior
                  </label>
                  <input
                    type="text"
                    name="direccion.numeroExterior"
                    value={formData.direccion.numeroExterior}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Número Interior */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número Interior
                  </label>
                  <input
                    type="text"
                    name="direccion.numeroInterior"
                    value={formData.direccion.numeroInterior}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Colonia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colonia
                  </label>
                  <input
                    type="text"
                    name="direccion.colonia"
                    value={formData.direccion.colonia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Código Postal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="direccion.codigoPostal"
                    value={formData.direccion.codigoPostal}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    maxLength={5}
                  />
                </div>

                {/* Municipio/Alcaldía */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipio/Alcaldía
                  </label>
                  <input
                    type="text"
                    name="direccion.municipio"
                    value={formData.direccion.municipio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    name="direccion.estado"
                    value={formData.direccion.estado}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecciona un estado</option>
                    {estados.map(estado => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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