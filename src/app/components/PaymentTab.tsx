'use client';
import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { uploadFile } from '@/lib/firebase/firebaseUtils';
import { toast } from 'react-hot-toast';
import { verifyStripeAccount, verifyPaypalEmail } from '@/lib/payments';

const translations = {
  es: {
    add: 'Agregar Método',
    addPayment: 'Agregar Método de Pago',
    edit: 'Editar Método de Pago',
    back: 'Atrás',
    save: 'Guardar Cambios',
    default: 'Predeterminado',
    setDefault: 'Marcar como predeterminado',
    deactivate: 'Desactivar',
    activate: 'Activar',
    uploadDoc: 'Comprobante',
  },
  en: {
    add: 'Add Method',
    addPayment: 'Add Payment Method',
    edit: 'Edit Payment Method',
    back: 'Back',
    save: 'Save Changes',
    default: 'Default',
    setDefault: 'Set as default',
    deactivate: 'Deactivate',
    activate: 'Activate',
    uploadDoc: 'Document',
  },
};

const locale = typeof navigator !== 'undefined' && navigator.language.startsWith('en') ? 'en' : 'es';
const t = (key: keyof typeof translations.es) => translations[locale][key];

import type { PaymentMethod } from '@/lib/types/payment';

interface PaymentTabProps {
  userId: string;
  paymentMethods: PaymentMethod[];
  onPaymentUpdate: (methods: PaymentMethod[]) => void;
  onDefaultChange?: (method: PaymentMethod | null) => void;
}

export default function PaymentTab({ userId, paymentMethods, onPaymentUpdate, onDefaultChange }: PaymentTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [methodToEdit, setMethodToEdit] = useState<PaymentMethod | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Estado para el modal de selección de método
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [formData, setFormData] = useState({
    bank: '',
    clabe: '',
    beneficiary: '',
    cardNumber: '',
    cardHolder: '',
    paypalEmail: '',
    stripeAccount: ''
  });

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'paymentInfo', userId), snap => {
      const data = snap.data();
      if (data?.methods) {
        const methods = Object.values(data.methods) as PaymentMethod[];
        onPaymentUpdate(methods);
        const def = methods.find(m => m.isDefault);
        if (onDefaultChange) onDefaultChange(def || null);
      }
    });
    return () => unsub();
  }, [userId]);

  const bankList = ['BBVA', 'Santander', 'Banorte', 'HSBC', 'Citibanamex'];

  const paymentOptions = [
    {
      id: 'bank_transfer',
      name: 'Transferencia Bancaria',
      icon: '🏦'
    },
    {
      id: 'bank_account',
      name: 'Cuenta de Banco',
      icon: '💳'
    },
    {
      id: 'card',
      name: 'Depósito en Tarjeta',
      icon: '💳'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '📱'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: '💰'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validaciones básicas
      if (selectedMethod === 'bank_transfer' && formData.clabe?.length !== 18) {
        throw new Error('La CLABE debe tener 18 dígitos');
      }
      if (selectedMethod === 'card' && formData.cardNumber && formData.cardNumber.replace(/\D/g, '').length !== 16) {
        throw new Error('La tarjeta debe tener 16 dígitos');
      }
      if (selectedMethod === 'paypal' && formData.paypalEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.paypalEmail)) {
          throw new Error('El correo no es válido');
        }
        await verifyPaypalEmail(formData.paypalEmail);
      }
      if (selectedMethod === 'stripe' && formData.stripeAccount) {
        await verifyStripeAccount(formData.stripeAccount);
      }

      let documentUrl;
      if (documentFile) {
        documentUrl = await uploadFile(documentFile, `paymentDocs/${userId}/${documentFile.name}`);
      }

      const details: Record<string, any> = { ...formData };
      if (documentUrl !== undefined) {
        details.documentUrl = documentUrl;
      }

      const newMethod: PaymentMethod = {
        id: crypto.randomUUID(),
        type: selectedMethod,
        details,
        isDefault: paymentMethods.length === 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const paymentRef = doc(db, 'paymentInfo', userId);
      await setDoc(paymentRef, {
        methods: {
          [newMethod.id]: newMethod
        },
        userId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, 'paymentHistory', crypto.randomUUID()), {
        userId,
        methodId: newMethod.id,
        action: 'create',
        timestamp: serverTimestamp(),
      });

      onPaymentUpdate([...paymentMethods, newMethod]);
      if (newMethod.isDefault && onDefaultChange) onDefaultChange(newMethod);
      setShowModal(false);
      setSelectedMethod('');
      setFormData({
        bank: '',
        clabe: '',
        beneficiary: '',
        cardNumber: '',
        cardHolder: '',
        paypalEmail: '',
        stripeAccount: ''
      });
      setDocumentFile(null);
      toast.success('Método de pago agregado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar método de pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setMethodToEdit(method);
    setSelectedMethod(method.type);
    setFormData({
      bank: method.details.bank || '',
      clabe: method.details.clabe || '',
      beneficiary: method.details.beneficiary || '',
      cardNumber: method.details.cardNumber || '',
      cardHolder: method.details.cardHolder || '',
      paypalEmail: method.details.paypalEmail || '',
      stripeAccount: method.details.stripeAccount || ''
    });
    setDocumentFile(null);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodToEdit) return;
    setIsLoading(true);

    try {
      if (selectedMethod === 'bank_transfer' && formData.clabe?.length !== 18) {
        throw new Error('La CLABE debe tener 18 dígitos');
      }
      if (selectedMethod === 'card' && formData.cardNumber && formData.cardNumber.replace(/\D/g, '').length !== 16) {
        throw new Error('La tarjeta debe tener 16 dígitos');
      }
      if (selectedMethod === 'paypal' && formData.paypalEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.paypalEmail)) {
          throw new Error('El correo no es válido');
        }
        await verifyPaypalEmail(formData.paypalEmail);
      }
      if (selectedMethod === 'stripe' && formData.stripeAccount) {
        await verifyStripeAccount(formData.stripeAccount);
      }

      let documentUrl = methodToEdit.details.documentUrl;
      if (documentFile) {
        documentUrl = await uploadFile(documentFile, `paymentDocs/${userId}/${documentFile.name}`);
      }

      const details: Record<string, any> = { ...formData };
      if (documentUrl !== undefined) {
        details.documentUrl = documentUrl;
      }

      const updatedMethod = {
        ...methodToEdit,
        details,
        updatedAt: serverTimestamp(),
      };

      const paymentRef = doc(db, 'paymentInfo', userId);
      await setDoc(paymentRef, {
        methods: {
          [updatedMethod.id]: updatedMethod
        },
        userId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, 'paymentHistory', crypto.randomUUID()), {
        userId,
        methodId: updatedMethod.id,
        action: 'update',
        timestamp: serverTimestamp(),
      });

      const updatedMethods = paymentMethods.map(m =>
        m.id === updatedMethod.id ? updatedMethod : m
      );
      onPaymentUpdate(updatedMethods);
      
      setShowModal(false);
      setIsEditing(false);
      setMethodToEdit(null);
      setSelectedMethod('');
      setFormData({
        bank: '',
        clabe: '',
        beneficiary: '',
        cardNumber: '',
        cardHolder: '',
        paypalEmail: '',
        stripeAccount: ''
      });
      setDocumentFile(null);
      toast.success('Método de pago actualizado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el método de pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedMethods = paymentMethods.map(m => ({
        ...m,
        isDefault: m.id === id,
      }));

      const paymentRef = doc(db, 'paymentInfo', userId);
      const methodsObj = updatedMethods.reduce((acc: any, m) => {
        acc[m.id] = m;
        return acc;
      }, {});

      await setDoc(paymentRef, { methods: methodsObj, updatedAt: serverTimestamp() }, { merge: true });

      onPaymentUpdate(updatedMethods);
      const def = updatedMethods.find(m => m.isDefault) || null;
      if (onDefaultChange) onDefaultChange(def);

      await setDoc(doc(db, 'paymentHistory', crypto.randomUUID()), {
        userId,
        methodId: id,
        action: 'setDefault',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting default', error);
      toast.error('Error al actualizar el método predeterminado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setIsLoading(true);
    try {
      const updatedMethods = paymentMethods.map(m =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      );

      const paymentRef = doc(db, 'paymentInfo', userId);
      const methodsObj = updatedMethods.reduce((acc: any, m) => {
        acc[m.id] = m;
        return acc;
      }, {});

      await setDoc(paymentRef, { methods: methodsObj, updatedAt: serverTimestamp() }, { merge: true });

      onPaymentUpdate(updatedMethods);

      await setDoc(doc(db, 'paymentHistory', crypto.randomUUID()), {
        userId,
        methodId: id,
        action: 'toggleActive',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error toggling method', error);
      toast.error('Error al actualizar el método');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);

    try {
      const paymentRef = doc(db, 'paymentInfo', userId);
      await setDoc(paymentRef, {
        methods: {
          [id]: null
        },
        userId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, 'paymentHistory', crypto.randomUUID()), {
        userId,
        methodId: id,
        action: 'delete',
        timestamp: serverTimestamp(),
      });

      const updatedMethods = paymentMethods.filter(m => m.id !== id);
      onPaymentUpdate(updatedMethods);
      const def = updatedMethods.find(m => m.isDefault) || null;
      if (onDefaultChange) onDefaultChange(def);
      toast.success('Método de pago eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el método de pago');
    } finally {
      setIsLoading(false);
    }
  };

  // Vista principal
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Métodos de Pago</h2>
              <p className="mt-1 text-sm text-gray-500">
                Administra tus métodos de pago para recibir pagos de tus clientes
              </p>
            </div>
            {paymentMethods.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('add')}
                </button>
                <label className="flex items-center text-sm text-gray-600">
                  <input type="checkbox" className="mr-2" checked={showInactive} onChange={() => setShowInactive(!showInactive)} />
                  Mostrar inactivos
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.filter(m => showInactive || m.isActive).map((method) => (
                <div
                  key={method.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between group hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
                      <span className="text-2xl">{
                        method.type === 'bank_transfer' ? '🏦' :
                        method.type === 'bank_account' ? '🏛️' :
                        method.type === 'card' ? '💳' :
                        method.type === 'paypal' ? '📱' : '💰'
                      }</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center">{
                        method.type === 'bank_transfer' ? `${method.details.beneficiary}` :
                        method.type === 'card' ? `•••• ${method.details.cardNumber?.slice(-4)}` :
                        method.type === 'paypal' ? method.details.paypalEmail :
                        method.type === 'stripe' ? 'Cuenta Stripe' : method.details.bank
                      }
                        {method.isDefault && (
                          <span className="ml-2 text-xs text-blue-600">{t('default')}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{
                        method.type === 'bank_transfer' ? method.details.bank :
                        method.type === 'card' ? method.details.cardHolder :
                        method.type === 'paypal' ? 'PayPal' : 'Stripe'
                      }</p>
                      {method.type === 'bank_transfer' && (
                        <p className="text-xs text-gray-400 mt-1">
                          CLABE: ••••{method.details.clabe?.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                    >
                      <span className="sr-only">{t('setDefault')}</span>
                      ⭐
                    </button>
                    <button
                      onClick={() => handleToggleActive(method.id)}
                      className="p-2 text-gray-400 hover:text-yellow-600 rounded-lg hover:bg-yellow-50"
                    >
                      <span className="sr-only">{method.isActive ? t('deactivate') : t('activate')}</span>
                      {method.isActive ? '⏸' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleEdit(method)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No hay métodos de pago configurados
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
                Agrega los métodos de pago que deseas utilizar para recibir pagos de tus clientes
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('addPayment')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de selección y formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {!selectedMethod ? 'Selecciona un Método de Pago' :
                   isEditing ? t('edit') : t('addPayment')}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedMethod('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              {!selectedMethod ? (
                <div className="grid grid-cols-2 gap-4">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedMethod(option.id)}
                      className="flex flex-col items-center justify-center p-6 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                        {option.icon}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {option.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="space-y-6">
                  {/* Campos específicos según el método seleccionado */}
                  {(selectedMethod === 'bank_transfer' || selectedMethod === 'bank_account') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Beneficiario
                        </label>
                        <input
                          type="text"
                          value={formData.beneficiary || ''}
                          onChange={(e) => setFormData({...formData, beneficiary: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="Nombre completo del beneficiario"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Banco
                        </label>
                        <input
                          list="banks"
                          type="text"
                          value={formData.bank || ''}
                          onChange={(e) => setFormData({...formData, bank: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="ej: BBVA, Santander, etc."
                          required
                        />
                        <datalist id="banks">
                          {bankList.map(b => (
                            <option key={b} value={b} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CLABE Interbancaria
                        </label>
                        <input
                          type="text"
                          value={formData.clabe || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Solo números
                            if (value.length <= 18) {
                              setFormData({...formData, clabe: value});
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="18 dígitos"
                          maxLength={18}
                          required
                        />
                        {formData.clabe && formData.clabe.length !== 18 && (
                          <p className="text-sm text-red-500 mt-1">
                            La CLABE debe tener 18 dígitos
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {selectedMethod === 'card' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Tarjeta
                        </label>
                        <input
                          type="text"
                          value={formData.cardNumber || ''}
                          onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg text-gray-900"
                          maxLength={16}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titular de la Tarjeta
                        </label>
                        <input
                          type="text"
                          value={formData.cardHolder || ''}
                          onChange={(e) => setFormData({...formData, cardHolder: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg text-gray-900"
                          required
                        />
                      </div>
                    </>
                  )}

                  {selectedMethod === 'paypal' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correo de PayPal
                      </label>
                      <input
                        type="email"
                        value={formData.paypalEmail || ''}
                        onChange={(e) => setFormData({...formData, paypalEmail: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-gray-900"
                        required
                      />
                    </div>
                  )}

                  {selectedMethod === 'stripe' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID de Cuenta Stripe
                      </label>
                      <input
                        type="text"
                        value={formData.stripeAccount || ''}
                        onChange={(e) => setFormData({...formData, stripeAccount: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-gray-900"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('uploadDoc')}
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setDocumentFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('');
                        setIsEditing(false);
                        setMethodToEdit(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      {t('back')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Guardando...' : isEditing ? t('save') : t('addPayment')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 