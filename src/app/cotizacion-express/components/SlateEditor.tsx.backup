"use client";

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, BaseEditor, BaseElement, BaseText } from 'slate';
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { Button } from "@/app/components/ui/button";
import { Copy, Bold, Italic, Underline, List, Heading1, Settings, Plus, Trash2 } from "lucide-react";
import DynamicTools from "@/components/DynamicTools";
import { useAuth } from "@/lib/hooks/useAuth";
import { db } from "@/lib/firebase/firebase";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

// Tipos personalizados para Slate
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: {
      type: string
      children: CustomText[]
    }
    Text: {
      text: string
      bold?: boolean
      italic?: boolean
      underline?: boolean
    }
  }
}

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor
type CustomElement = {
  type: string
  children: CustomText[]
}
type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

interface SlateEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface PaymentMethod {
  id: string;
  type: string;
  details: Record<string, any>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

interface ContactInfo {
  name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  web?: string;
  address?: string;
}

interface RequirementItem {
  id: string;
  text: string;
  category: string;
}

const deserialize = (content: string): Descendant[] => {
  // Convertir el texto plano a estructura de Slate
  const lines = content.split('\n');
  return lines.map(line => ({
    type: 'paragraph',
    children: [{ text: line }],
  }));
};

const serialize = (nodes: Descendant[]): string => {
  return nodes.map(n => {
    if (SlateElement.isElement(n)) {
      return n.children.map(child => {
        if ('text' in child) {
          return child.text;
        }
        return '';
      }).join('');
    }
    return '';
  }).join('\n');
};

// Helpers para formato
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: Editor, format: string) => {
  const nodeEntries = Array.from(Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  }));
  return nodeEntries.length > 0;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  Transforms.setNodes(
    editor,
    { type: isActive ? 'paragraph' : format },
    { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
  );
};

const Toolbar = ({ onCopy }: { onCopy: () => void }) => {
  const editor = useSlate();
  
  return (
    <div className="flex items-center gap-1 p-3 border-b border-gray-200 bg-gray-50">
      <Button 
        variant="ghost" 
        size="sm" 
        onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'bold'); }}
        className={`h-8 w-8 p-0 ${isMarkActive(editor, 'bold') ? 'bg-blue-100 text-blue-700' : ''}`}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'italic'); }}
        className={`h-8 w-8 p-0 ${isMarkActive(editor, 'italic') ? 'bg-blue-100 text-blue-700' : ''}`}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'underline'); }}
        className={`h-8 w-8 p-0 ${isMarkActive(editor, 'underline') ? 'bg-blue-100 text-blue-700' : ''}`}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'heading-one'); }}
        className={`h-8 w-8 p-0 ${isBlockActive(editor, 'heading-one') ? 'bg-blue-100 text-blue-700' : ''}`}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'bulleted-list'); }}
        className={`h-8 w-8 p-0 ${isBlockActive(editor, 'bulleted-list') ? 'bg-blue-100 text-blue-700' : ''}`}
      >
        <List className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-gray-300 mx-2" />
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onCopy}
        className="h-8 px-3 flex items-center gap-1.5 hover:bg-blue-100 hover:text-blue-700 transition-colors"
        title="Copiar contenido"
      >
        <Copy className="h-4 w-4" />
        <span className="text-xs">Copiar</span>
      </Button>
    </div>
  );
};

const PaymentDataWidget = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMethodType, setSelectedMethodType] = useState<string>('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [lastGeneratedText, setLastGeneratedText] = useState('');
  const [formData, setFormData] = useState({
    bank: '',
    clabe: '',
    beneficiary: '',
    cardNumber: '',
    cardHolder: '',
    paypalEmail: '',
    stripeAccount: ''
  });

  const paymentOptions = [
    { id: 'bank_transfer', name: 'Transferencia Bancaria', icon: '🏦' },
    { id: 'card', name: 'Pago con Tarjeta', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '📱' },
    { id: 'stripe', name: 'Stripe', icon: '💰' }
  ];

  const getMethodLabel = (type: string) => {
    const labels: Record<string, string> = {
      'bank_transfer': 'Transferencia Bancaria',
      'bank_account': 'Cuenta de Banco', 
      'card': 'Pago con Tarjeta',
      'paypal': 'PayPal',
      'stripe': 'Stripe'
    };
    return labels[type] || 'Otro';
  };

  const getMethodIcon = (type: string) => {
    const icons: Record<string, string> = {
      'bank_transfer': '🏦',
      'bank_account': '🏛️',
      'card': '💳',
      'paypal': '📱',
      'stripe': '💰'
    };
    return icons[type] || '💰';
  };

  const getMethodDisplayName = (method: PaymentMethod) => {
    switch (method.type) {
      case 'bank_transfer':
      case 'bank_account':
        return method.details.beneficiary || 'Cuenta Bancaria';
      case 'card':
        return `•••• ${method.details.cardNumber?.slice(-4) || '****'}`;
      case 'paypal':
        return method.details.paypalEmail || 'PayPal';
      case 'stripe':
        return 'Cuenta Stripe';
      default:
        return 'Método de Pago';
    }
  };

  const getMethodSubtitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'bank_transfer':
      case 'bank_account':
        return method.details.bank || '';
      case 'card':
        return method.details.cardHolder || '';
      case 'paypal':
        return 'PayPal';
      case 'stripe':
        return 'Stripe';
      default:
        return '';
    }
  };

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    // Escuchar cambios en tiempo real de los métodos de pago
    const unsubscribe = onSnapshot(doc(db, 'paymentInfo', user.uid), (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.methods) {
            const methods = Object.values(data.methods).filter(Boolean) as PaymentMethod[];
            const activeMethods = methods.filter(m => m.isActive);
            setPaymentMethods(activeMethods);
            
            // Si no hay método seleccionado, usar el predeterminado
            if (!selectedMethodId) {
              const defaultMethod = activeMethods.find(m => m.isDefault);
              if (defaultMethod) {
                setSelectedMethodId(defaultMethod.id);
              }
            }
          } else {
            setPaymentMethods([]);
          }
        } else {
          setPaymentMethods([]);
        }
      } catch (error) {
        console.error("Error al cargar métodos de pago:", error);
        setPaymentMethods([]);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, selectedMethodId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      // Validaciones
      if (selectedMethodType === 'bank_transfer' && formData.clabe?.length !== 18) {
        showNotification('error', 'La CLABE debe tener 18 dígitos');
        return;
      }
      if (selectedMethodType === 'card' && formData.cardNumber && formData.cardNumber.replace(/\D/g, '').length !== 16) {
        showNotification('error', 'La tarjeta debe tener 16 dígitos');
        return;
      }
      if (selectedMethodType === 'paypal' && formData.paypalEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.paypalEmail)) {
          showNotification('error', 'El correo no es válido');
          return;
        }
      }

      const newMethod: PaymentMethod = {
        id: crypto.randomUUID(),
        type: selectedMethodType,
        details: { ...formData },
        isDefault: paymentMethods.length === 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const paymentRef = doc(db, 'paymentInfo', user.uid);
      await setDoc(paymentRef, {
        methods: {
          [newMethod.id]: newMethod
        },
        userId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Limpiar formulario y cerrar modal
      setFormData({
        bank: '',
        clabe: '',
        beneficiary: '',
        cardNumber: '',
        cardHolder: '',
        paypalEmail: '',
        stripeAccount: ''
      });
      setSelectedMethodType('');
      showNotification('success', 'Método de pago agregado exitosamente');
      
      // Cerrar modal después de un breve delay para mostrar la notificación
      setTimeout(() => setShowModal(false), 1500);
      
    } catch (error) {
      console.error('Error:', error);
      showNotification('error', 'Error al agregar método de pago');
    }
  };

  // Función mejorada para insertar al final después de la firma
  const insertAtEndProperly = (currentText: string, newText: string): string => {
    const lines = currentText.split('\n');
    let insertIndex = lines.length;
    
    // Buscar la firma para insertar después
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].toLowerCase().trim();
      if (line.includes('firma') || 
          line.includes('atentamente') || 
          line.includes('cordialmente') ||
          line.includes('saludos') ||
          line.includes('lawgic')) {
        // Buscar el final del párrafo de firma
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '') {
          j++;
        }
        insertIndex = j;
        break;
      }
    }
    
    // Insertar después de la firma con espaciado apropiado
    const newLines = [...lines];
    if (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      // Ya hay una línea vacía, insertar ahí
      newLines.splice(insertIndex, 0, newText, '');
    } else {
      // Agregar con espaciado apropiado
      newLines.splice(insertIndex, 0, '', newText);
    }
    
    return newLines.join('\n');
  };

  // Función mejorada para insertar armónicamente
  const insertHarmonically = (currentText: string, newText: string): string => {
    const lines = currentText.split('\n');
    let insertIndex = -1;
    
    // 1. Buscar después de "Contraprestación" o "Forma de Pago"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (line.includes('contraprestación') || 
          line.includes('forma de pago') || 
          line.includes('costo total') ||
          line.includes('precio') ||
          line.includes('el pago debe realizarse')) {
        // Buscar el final de este párrafo
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '') {
          j++;
        }
        insertIndex = j;
        break;
      }
    }
    
    // 2. Si no encontramos la sección de pago, buscar antes de "Proceso" o similar
    if (insertIndex === -1) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim();
        if (line.includes('proceso') || 
            line.includes('evaluación inicial') ||
            line.includes('presentación formal')) {
          insertIndex = i;
          break;
        }
      }
    }
    
    // 3. Si no encontramos nada específico, buscar antes de "Firma" o similar
    if (insertIndex === -1) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim();
        if (line.includes('firma') || 
            line.includes('atentamente') || 
            line.includes('cordialmente') ||
            line.includes('saludos')) {
          insertIndex = i;
          break;
        }
      }
    }
    
    // 4. Como último recurso, insertar en el 75% del documento
    if (insertIndex === -1) {
      insertIndex = Math.floor(lines.length * 0.75);
    }
    
    // Insertar el texto con espaciado apropiado
    const newLines = [...lines];
    if (insertIndex > 0 && newLines[insertIndex - 1].trim() !== '') {
      // Agregar línea vacía antes si es necesario
      newLines.splice(insertIndex, 0, '', newText, '');
    } else {
      newLines.splice(insertIndex, 0, newText, '');
    }
    
    return newLines.join('\n');
  };

  const removePreviousAIText = (text: string) => {
    if (!lastGeneratedText) return text;
    const cleaned = text.replace(lastGeneratedText, '').replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  const insertWithCleanup = (
    currentText: string,
    newText: string,
    type: 'end' | 'harmonic'
  ): string => {
    const cleaned = removePreviousAIText(currentText);
    return type === 'end'
      ? insertAtEndProperly(cleaned, newText)
      : insertHarmonically(cleaned, newText);
  };

  const generateAIContent = async (insertionType: 'end' | 'harmonic') => {
    const currentSelectedMethodId = paymentMethods.length === 1 ? paymentMethods[0].id : selectedMethodId;
    
    if (!currentSelectedMethodId) {
      showNotification('error', 'Selecciona un método de pago primero');
      return;
    }

    setIsGeneratingAI(true);
    setShowAIOptions(false);

    try {
      const selectedMethod = paymentMethods.find(m => m.id === currentSelectedMethodId);
      if (!selectedMethod) return;

      console.log('🚀 Iniciando generación de IA:', { 
        insertionType, 
        method: selectedMethod.type,
        currentTextLength: value.length 
      });

      // Preparar datos del método de pago para el prompt
      const methodInfo = {
        type: getMethodLabel(selectedMethod.type),
        displayName: getMethodDisplayName(selectedMethod),
        subtitle: getMethodSubtitle(selectedMethod),
        details: selectedMethod.details
      };

      const response = await fetch('/api/ai/generate-payment-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          methodInfo,
          insertionType,
          replaceExisting: Boolean(lastGeneratedText),
          currentText: value // Texto actual del editor
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar contenido con IA');
      }

      const { generatedText } = await response.json();
      console.log('✨ Texto generado por IA:', generatedText);
      
      // Insertar el texto generado según el tipo con lógica mejorada
      const newValue = insertWithCleanup(value, generatedText, insertionType);
      setLastGeneratedText(generatedText.trim());
      
      console.log('📝 Aplicando nuevo valor:', { 
        originalLength: value.length,
        newLength: newValue.length,
        difference: newValue.length - value.length,
        preview: newValue.substring(value.length - 50, value.length + 100)
      });
      
      onChange(newValue);
      showNotification('success', 'Contenido agregado con IA exitosamente');
      
    } catch (error) {
      console.error('Error generating AI content:', error);
      showNotification('error', 'Error al generar contenido con IA');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-gray-900">Datos de pago</h4>
          {paymentMethods.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Agregar método"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {paymentMethods.length === 0 ? (
          // No hay métodos configurados
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 mb-3">No hay métodos configurados</p>
            <button
              onClick={() => setShowModal(true)}
              className="w-full inline-flex items-center justify-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Configurar métodos de pago
            </button>
          </div>
        ) : paymentMethods.length === 1 ? (
          // Solo un método - mostrarlo directamente
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getMethodIcon(paymentMethods[0].type)}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {getMethodLabel(paymentMethods[0].type)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getMethodDisplayName(paymentMethods[0])}
              </p>
              {getMethodSubtitle(paymentMethods[0]) && (
                <p className="text-xs text-gray-600 mt-1">
                  {getMethodSubtitle(paymentMethods[0])}
                </p>
              )}
              {paymentMethods[0].type === 'bank_transfer' && paymentMethods[0].details.clabe && (
                <p className="text-xs text-gray-400 mt-1">
                  CLABE: ••••{paymentMethods[0].details.clabe.slice(-4)}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Múltiples métodos - selector
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Método seleccionado
              </label>
              <select
                value={selectedMethodId || ''}
                onChange={(e) => setSelectedMethodId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar método...</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {getMethodIcon(method.type)} {getMethodDisplayName(method)} - {getMethodLabel(method.type)}
                  </option>
                ))}
              </select>
            </div>

            {selectedMethod && (
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getMethodIcon(selectedMethod.type)}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {getMethodLabel(selectedMethod.type)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getMethodDisplayName(selectedMethod)}
                  </p>
                  {getMethodSubtitle(selectedMethod) && (
                    <p className="text-xs text-gray-600 mt-1">
                      {getMethodSubtitle(selectedMethod)}
                    </p>
                  )}
                  {selectedMethod.type === 'bank_transfer' && selectedMethod.details.clabe && (
                    <p className="text-xs text-gray-400 mt-1">
                      CLABE: ••••{selectedMethod.details.clabe.slice(-4)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nuevo botón de IA */}
        {paymentMethods.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="relative">
              <button
                onClick={() => setShowAIOptions(!showAIOptions)}
                disabled={isGeneratingAI}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {isGeneratingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando con IA...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    Agregar con IA
                  </>
                )}
              </button>

              {/* Dropdown de opciones */}
              {showAIOptions && !isGeneratingAI && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => generateAIContent('end')}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 rounded-t-lg border-b border-gray-100"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">📝</span>
                      <div>
                        <p className="font-medium text-gray-900">Al final del texto</p>
                        <p className="text-xs text-gray-500">Agregar información de pago al final</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => generateAIContent('harmonic')}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 rounded-b-lg"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">🎯</span>
                      <div>
                        <p className="font-medium text-gray-900">Armónicamente dentro del texto</p>
                        <p className="text-xs text-gray-500">Integrar naturalmente en el contenido</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notificación flotante para IA */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-3 rounded-lg border shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {notification.type === 'success' ? '✅' : '❌'}
              </span>
              {notification.message}
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar método de pago */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {!selectedMethodType ? 'Selecciona un Método de Pago' : 'Configurar Método de Pago'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedMethodType('');
                    setNotification(null);
                    setFormData({
                      bank: '', clabe: '', beneficiary: '', cardNumber: '', cardHolder: '', paypalEmail: '', stripeAccount: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Notificación integrada */}
              {notification && (
                <div className={`mb-4 p-3 rounded-lg border ${
                  notification.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    <span className="mr-2">
                      {notification.type === 'success' ? '✅' : '❌'}
                    </span>
                    {notification.message}
                  </div>
                </div>
              )}

              {!selectedMethodType ? (
                // Selección de tipo de método
                <div className="grid grid-cols-2 gap-4">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedMethodType(option.id)}
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
                // Formulario de configuración
                <form onSubmit={handleSubmit} className="space-y-4">
                  {selectedMethodType === 'bank_transfer' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Beneficiario
                        </label>
                        <input
                          type="text"
                          value={formData.beneficiary}
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
                          type="text"
                          value={formData.bank}
                          onChange={(e) => setFormData({...formData, bank: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="ej: BBVA, Santander, etc."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CLABE Interbancaria
                        </label>
                        <input
                          type="text"
                          value={formData.clabe}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 18) {
                              setFormData({...formData, clabe: value});
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="18 dígitos"
                          maxLength={18}
                          required
                        />
                      </div>
                    </>
                  )}

                  {selectedMethodType === 'card' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Tarjeta
                        </label>
                        <input
                          type="text"
                          value={formData.cardNumber}
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
                          value={formData.cardHolder}
                          onChange={(e) => setFormData({...formData, cardHolder: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg text-gray-900"
                          required
                        />
                      </div>
                    </>
                  )}

                  {selectedMethodType === 'paypal' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correo de PayPal
                      </label>
                      <input
                        type="email"
                        value={formData.paypalEmail}
                        onChange={(e) => setFormData({...formData, paypalEmail: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-gray-900"
                        required
                      />
                    </div>
                  )}

                  {selectedMethodType === 'stripe' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID de Cuenta Stripe
                      </label>
                      <input
                        type="text"
                        value={formData.stripeAccount}
                        onChange={(e) => setFormData({...formData, stripeAccount: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-gray-900"
                        required
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMethodType('')}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Guardar Método
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ContactDataWidget = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const { user } = useAuth();
  const [contact, setContact] = useState<ContactInfo>({ name: '', phone: '', mobile: '', email: '', web: '', address: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ContactInfo>({ name: '', phone: '', mobile: '', email: '', web: '', address: '' });
  const [error, setError] = useState<string | null>(null);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [lastGeneratedText, setLastGeneratedText] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    console.log('🔧 ContactDataWidget mounted, user:', user?.uid);
    
    if (!user?.uid) { 
      console.log('❌ No user found, setting loading to false');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('📡 Setting up Firebase listener for contact data');
      const unsubscribe = onSnapshot(
        doc(db, 'DatosContacto', user.uid), 
        (snap) => {
          console.log('📬 Firebase snapshot received:', snap.exists(), snap.data());
          if (snap.exists()) {
            const data = snap.data() as ContactInfo;
            setContact({
              name: data.name || '',
              phone: data.phone || '',
              mobile: data.mobile || '',
              email: data.email || '',
              web: data.web || '',
              address: data.address || ''
            });
          }
          setIsLoading(false);
        },
        (err) => {
          console.error('❌ Firebase error:', err);
          setError(err.message);
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error('❌ Error setting up Firebase listener:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    try {
      console.log('💾 Saving contact data:', formData);
      await setDoc(doc(db, 'DatosContacto', user.uid), {
        name: formData.name,
        phone: formData.phone,
        mobile: formData.mobile,
        email: formData.email,
        web: formData.web,
        address: formData.address,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setContact(formData);
      setShowModal(false);
      console.log('✅ Contact data saved successfully');
    } catch (err) {
      console.error('❌ Error saving contact data:', err);
      setError(err instanceof Error ? err.message : 'Error saving data');
    }
  };

  const insertContact = () => {
    const lines: string[] = [];
    if (contact.name) lines.push(`Nombre: ${contact.name}`);
    if (contact.phone) lines.push(`Teléfono: ${contact.phone}`);
    if (contact.mobile) lines.push(`Móvil: ${contact.mobile}`);
    if (contact.email) lines.push(`Email: ${contact.email}`);
    if (contact.web) lines.push(`Web: ${contact.web}`);
    if (contact.address) lines.push(`Domicilio: ${contact.address}`);
    const contactText = `\n\nContacto:\n${lines.join('\n')}`;
    onChange(value + contactText);
    console.log('📝 Contact text inserted:', contactText);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const insertAtEndProperly = (currentText: string, newText: string): string => {
    const lines = currentText.split('\n');
    let insertIndex = lines.length;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].toLowerCase().trim();
      if (line.includes('firma') ||
          line.includes('atentamente') ||
          line.includes('cordialmente') ||
          line.includes('saludos') ||
          line.includes('lawgic')) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '') {
          j++;
        }
        insertIndex = j;
        break;
      }
    }

    const newLines = [...lines];
    if (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      newLines.splice(insertIndex, 0, newText, '');
    } else {
      newLines.splice(insertIndex, 0, '', newText);
    }

    return newLines.join('\n');
  };

  const insertHarmonically = (currentText: string, newText: string): string => {
    const lines = currentText.split('\n');
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (line.includes('contraprestación') ||
          line.includes('forma de pago') ||
          line.includes('costo total') ||
          line.includes('precio') ||
          line.includes('el pago debe realizarse')) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '') {
          j++;
        }
        insertIndex = j;
        break;
      }
    }

    if (insertIndex === -1) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim();
        if (line.includes('proceso') ||
            line.includes('evaluación inicial') ||
            line.includes('presentación formal')) {
          insertIndex = i;
          break;
        }
      }
    }

    if (insertIndex === -1) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim();
        if (line.includes('firma') ||
            line.includes('atentamente') ||
            line.includes('cordialmente') ||
            line.includes('saludos')) {
          insertIndex = i;
          break;
        }
      }
    }

    if (insertIndex === -1) {
      insertIndex = Math.floor(lines.length * 0.75);
    }

    const newLines = [...lines];
    if (insertIndex > 0 && newLines[insertIndex - 1].trim() !== '') {
      newLines.splice(insertIndex, 0, '', newText, '');
    } else {
      newLines.splice(insertIndex, 0, newText, '');
    }

    return newLines.join('\n');
  };

  const removePreviousAIText = (text: string) => {
    if (!lastGeneratedText) return text;
    const cleaned = text.replace(lastGeneratedText, '').replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  const insertWithCleanup = (
    currentText: string,
    newText: string,
    type: 'end' | 'harmonic'
  ): string => {
    const cleaned = removePreviousAIText(currentText);
    return type === 'end'
      ? insertAtEndProperly(cleaned, newText)
      : insertHarmonically(cleaned, newText);
  };

  const generateAIContent = async (insertionType: 'end' | 'harmonic') => {
    const hasData = contact.name || contact.phone || contact.mobile || contact.email || contact.web || contact.address;

    if (!hasData) {
      showNotification('error', 'Agrega datos de contacto primero');
      return;
    }

    setIsGeneratingAI(true);
    setShowAIOptions(false);

    try {
      const contactInfo = { ...contact };

      console.log('🚀 Iniciando generación de IA (contact):', {
        insertionType,
        currentTextLength: value.length,
        contactInfo,
      });

      const response = await fetch('/api/ai/generate-contact-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactInfo,
          insertionType,
          replaceExisting: Boolean(lastGeneratedText),
          currentText: value,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar contenido con IA');
      }

      const { generatedText } = await response.json();
      console.log('✨ Texto generado por IA (contact):', generatedText);

      const newValue = insertWithCleanup(value, generatedText, insertionType);
      setLastGeneratedText(generatedText.trim());

      onChange(newValue);
      showNotification('success', 'Contenido agregado con IA exitosamente');

    } catch (error) {
      console.error('Error generating AI contact content:', error);
      showNotification('error', 'Error al generar contenido con IA');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  console.log('🎨 ContactDataWidget rendering - isLoading:', isLoading, 'error:', error, 'user:', !!user);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-sm text-red-800">Error en Datos de Contacto</h4>
        <p className="text-xs text-red-600 mt-1">{error}</p>
        <button 
          onClick={() => setError(null)} 
          className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-sm text-gray-900 mb-2">Datos de contacto</h4>
        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-gray-900">Datos de contacto</h4>
          <button onClick={() => { setShowModal(true); setFormData(contact); }} className="p-1 text-gray-400 hover:text-gray-600" title="Editar datos">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {!(contact.name || contact.phone || contact.mobile || contact.email || contact.web || contact.address) ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 mb-3">No hay datos configurados</p>
            <button onClick={() => setShowModal(true)} className="w-full inline-flex items-center justify-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              <Plus className="h-4 w-4 mr-1" /> Configurar datos de contacto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Información principal */}
            <div className="space-y-2">
              {contact.name && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-4">👤</span>
                  <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-4">☎️</span>
                  <span className="text-sm text-gray-700">{contact.phone}</span>
                </div>
              )}
              
              {contact.mobile && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-4">📱</span>
                  <span className="text-sm text-gray-700">{contact.mobile}</span>
                </div>
              )}
              
              {contact.email && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-4">📧</span>
                  <span className="text-sm text-gray-700 break-all">{contact.email}</span>
                </div>
              )}
              
              {contact.web && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-4">🌐</span>
                  <span className="text-sm text-gray-700">{contact.web}</span>
                </div>
              )}
              
              {contact.address && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs w-4 mt-0.5">🏠</span>
                  <span className="text-sm text-gray-700 leading-tight">{contact.address}</span>
                </div>
              )}
            </div>
            
            {/* Botón de IA */}
            <div className="pt-3 border-t border-gray-100">
              <div className="relative">
                <button
                  onClick={() => setShowAIOptions(!showAIOptions)}
                  disabled={isGeneratingAI}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generando con IA...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      Agregar con IA
                    </>
                  )}
                </button>

                {/* Dropdown igual que en PaymentDataWidget */}
                {showAIOptions && !isGeneratingAI && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => generateAIContent('end')}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 rounded-t-lg border-b border-gray-100"
                    >
                      <div className="flex items-center">
                        <span className="mr-3">📝</span>
                        <div>
                          <p className="font-medium text-gray-900">Al final del texto</p>
                          <p className="text-xs text-gray-500">Agregar información de contacto al final</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => generateAIContent('harmonic')}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 rounded-b-lg"
                    >
                      <div className="flex items-center">
                        <span className="mr-3">🎯</span>
                        <div>
                          <p className="font-medium text-gray-900">Armónicamente dentro del texto</p>
                          <p className="text-xs text-gray-500">Integrar naturalmente en el contenido</p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notificación flotante */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-3 rounded-lg border shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {notification.type === 'success' ? '✅' : '❌'}
              </span>
              {notification.message}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Configurar Contacto</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Móvil</label>
                <input type="text" value={formData.mobile || ''} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input type="text" value={formData.web || ''} onChange={e => setFormData({ ...formData, web: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                <textarea value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-gray-900" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const RequirementsWidget = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRequirements, setGeneratedRequirements] = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<boolean[]>([]);

  const handleGenerateClick = async () => {
    setShowModal(true);
    setIsGenerating(true);
    setGeneratedRequirements([]);
    setSelectedRequirements([]);

    try {
      console.log('🚀 Generando requerimientos con IA...');
      
      const response = await fetch('/api/ai/generate-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentText: value
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const { requirements, success } = await response.json();
      
      if (!success || !Array.isArray(requirements)) {
        throw new Error('Respuesta inválida de la API');
      }
      
      console.log('✨ Requerimientos generados:', requirements);
      
      setGeneratedRequirements(requirements);
      setSelectedRequirements(new Array(requirements.length).fill(true));
      
    } catch (error) {
      console.error('❌ Error generando requerimientos:', error);
      
      // Fallback con requerimientos genéricos en caso de error
      const fallbackRequirements = [
        'Información completa',
        'Documentos existentes', 
        'Contacto designado',
        'Accesos necesarios',
        'Horarios disponibles',
        'Criterios específicos',
        'Material referencia',
        'Reuniones programadas'
      ];
      
      setGeneratedRequirements(fallbackRequirements);
      setSelectedRequirements(new Array(fallbackRequirements.length).fill(true));
      
      // Mostrar mensaje de error temporal (opcional)
      console.warn('🔄 Usando requerimientos de respaldo debido a error en IA');
      
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRequirementToggle = (index: number) => {
    const newSelected = [...selectedRequirements];
    newSelected[index] = !newSelected[index];
    setSelectedRequirements(newSelected);
  };

  const handleInsertRequirements = () => {
    const selectedReqs = generatedRequirements.filter((_, index) => selectedRequirements[index]);
    
    if (selectedReqs.length === 0) return;
    
    let reqText = "\n\nANEXO - LISTA DE REQUERIMIENTOS:\n\n";
    reqText += "REQUERIMIENTOS DEL CLIENTE:\n";
    selectedReqs.forEach((req, index) => {
      reqText += `${index + 1}. ${req}\n`;
    });
    reqText += "\n";
    
    // Insertar al final del documento
    const lines = value.split('\n');
    let insertIndex = lines.length;
    
    // Buscar antes de la firma
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].toLowerCase().trim();
      if (line.includes('firma') || line.includes('atentamente') || line.includes('cordialmente') || line.includes('saludos')) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '') {
          j++;
        }
        insertIndex = j;
        break;
      }
    }
    
    const newLines = [...lines];
    if (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      newLines.splice(insertIndex, 0, reqText, '');
    } else {
      newLines.splice(insertIndex, 0, '', reqText);
    }
    
    onChange(newLines.join('\n'));
    setShowModal(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-gray-900">Anexo Lista de requerimientos</h4>
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-500 mb-3">Genera automáticamente una lista de requerimientos</p>
          <button 
            onClick={handleGenerateClick}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generar con IA
          </button>
        </div>
      </div>

      {/* Modal para generar requerimientos con IA */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generar Lista de Requerimientos</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {isGenerating ? (
              // Estado de carga
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Analizando tu cotización...
                </h4>
                <p className="text-sm text-gray-600">
                  La IA está generando requerimientos personalizados basados en el contenido de tu proyecto.
                </p>
              </div>
            ) : generatedRequirements.length === 0 ? (
              // Estado inicial
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  IA para Lista de Requerimientos
                </h4>
                
                <p className="text-sm text-gray-600 mb-6">
                  La inteligencia artificial analizará tu cotización y generará automáticamente una lista de requerimientos personalizada.
                </p>
              </div>
            ) : (
              // Lista de requerimientos generados
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Requerimientos Sugeridos
                  </h4>
                  <p className="text-sm text-gray-600">
                    Selecciona los requerimientos que deseas incluir en tu cotización:
                  </p>
                </div>
                
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {generatedRequirements.map((requirement, index) => (
                    <label key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRequirements[index]}
                        onChange={() => handleRequirementToggle(index)}
                        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900 flex-1">
                        {requirement}
                      </span>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button 
                    onClick={handleInsertRequirements}
                    disabled={!selectedRequirements.some(Boolean)}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Insertar Requerimientos Seleccionados ({selectedRequirements.filter(Boolean).length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const SlateEditor: React.FC<SlateEditorProps> = ({ value, onChange }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  const getInitialValue = (): Descendant[] => {
    if (!value || value.trim() === '') {
      return [{ type: 'paragraph', children: [{ text: '' }] } as Descendant];
    }
    try {
      return deserialize(value);
    } catch (error) {
      console.error('Error deserializing value:', error);
      return [{ type: 'paragraph', children: [{ text: value }] } as Descendant];
    }
  };

  const [editorValue, setEditorValue] = useState<Descendant[]>(getInitialValue);

  useEffect(() => {
    const currentSerialized = serialize(editorValue);
    if (value !== currentSerialized) {
      console.log('🔄 Actualizando editor:', { 
        newValue: value.substring(0, 100) + '...', 
        oldValue: currentSerialized.substring(0, 100) + '...',
        wordCountNew: value.split(/\s+/).length,
        wordCountOld: currentSerialized.split(/\s+/).length
      });
      
      const newEditorValue = getInitialValue();
      setEditorValue(newEditorValue);
      
      // Forzar actualización del editor Slate
      try {
        Editor.withoutNormalizing(editor, () => {
          // Limpiar el contenido actual
          Transforms.select(editor, {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, [])
          });
          Transforms.delete(editor);
          
          // Insertar el nuevo contenido
          Transforms.insertNodes(editor, newEditorValue);
        });
      } catch (error) {
        console.error('Error al actualizar editor:', error);
        // Fallback: reemplazar todo el contenido del editor
        editor.children = newEditorValue;
        editor.onChange();
      }
    }
  }, [value, editor]);

  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case 'heading-one':
        return <h1 {...props.attributes}>{props.children}</h1>;
      case 'bulleted-list':
        return <ul {...props.attributes}>{props.children}</ul>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  const renderLeaf = useCallback((props: any) => {
    let children = props.children;

    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }
    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }

    return <span {...props.attributes}>{children}</span>;
  }, []);

  // Calcular estadísticas
  const getWordCount = useCallback((text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }, []);

  const currentText = serialize(editorValue);
  const wordCount = getWordCount(currentText);
  const characterCount = currentText.length;

  const insertAtEnd = (text: string) => {
    const end = Editor.end(editor, [])
    Transforms.select(editor, end)
    Transforms.insertText(editor, text)
  }

  // Funciones para los botones
  const handleCopy = async () => {
    try {
      // Intentar usar la API moderna del portapapeles
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentText);
        setCopyNotification('¡Contenido copiado exitosamente!');
      } else {
        // Fallback para navegadores más antiguos
        const textArea = document.createElement('textarea');
        textArea.value = currentText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (result) {
          setCopyNotification('¡Contenido copiado exitosamente!');
        } else {
          throw new Error('No se pudo copiar el contenido');
        }
      }
      
      // Limpiar notificación después de 3 segundos
      setTimeout(() => setCopyNotification(null), 3000);
      
    } catch (err) {
      console.error('Error al copiar:', err);
      setCopyNotification('Error al copiar el contenido');
      setTimeout(() => setCopyNotification(null), 3000);
    }
  };

  return (
    <div className="flex w-full max-w-full">
      {/* Left Column (70%) - Editor */}
      <div className="w-[70%]">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <Slate
            editor={editor}
            initialValue={editorValue}
            onChange={newValue => {
              setEditorValue(newValue);
              const isAstChange = editor.operations.some(
                op => 'set_selection' !== op.type
              );
              if (isAstChange) {
                onChange(serialize(newValue));
              }
            }}
          >
            <Toolbar onCopy={handleCopy} />
            
            {/* Editor */}
            <div className="p-4">
              <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="Edite la cotización aquí..."
                spellCheck={false}
                className="min-h-[400px] w-full p-4 text-sm leading-relaxed text-gray-900 bg-white border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Footer with stats */}
            <div className="flex items-center justify-end gap-4 p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
              <span className="text-orange-600 font-medium">{wordCount} palabras</span>
              <span>{characterCount} caracteres</span>
              <span className="text-gray-500">Recomendado: 250-350 palabras</span>
            </div>
          </Slate>
        </div>
      </div>

      {/* Right Column (30%) - Dynamic Tools */}
      <div className="w-[30%] p-4 bg-slate-50">
        <h3 className="font-semibold text-lg mb-4">Herramientas Dinámicas</h3>
        
        {/* Datos de pago */}
        <div className="mb-6">
          <PaymentDataWidget value={currentText} onChange={onChange} />
        </div>

        {/* Datos de contacto */}
        <div className="mb-6">
          <ContactDataWidget value={currentText} onChange={onChange} />
        </div>

        {/* Lista de requerimientos */}
        <div className="mb-6">
          <RequirementsWidget value={currentText} onChange={onChange} />
        </div>

        {/* Espacio para futuras herramientas */}
        <div className="border border-dashed border-gray-200 rounded-md p-3 text-center">
          <p className="text-gray-400 text-xs">Próximamente más herramientas</p>
        </div>
      </div>

      {/* Notificación de copiado */}
      {copyNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`p-3 rounded-lg border shadow-lg ${
            copyNotification.includes('Error') 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {copyNotification.includes('Error') ? '❌' : '✅'}
              </span>
              {copyNotification}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlateEditor; 