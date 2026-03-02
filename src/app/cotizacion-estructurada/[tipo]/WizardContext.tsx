'use client';
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { db, storage } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, doc, onSnapshot, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { tiposConfig, VALID_TIPOS, DEFAULT_CUSTOM_BLOCKS, type Servicio, type CustomBlock } from './constants';
import { TermTemplate } from '@/lib/types/terms';
import { PaymentMethod } from '@/lib/types/payment';

interface WizardContextType {
  // Core
  tipo: string;
  step: number;
  setStep: (step: number) => void;
  formData: any;
  setFormData: (fn: any) => void;
  handleInputChange: (field: string, value: string | boolean) => void;

  // Navigation
  handleNextStep: () => void;
  handleBackStep: () => void;

  // Add-Ons
  selectedAddOns: Set<string>;
  setSelectedAddOns: (fn: any) => void;
  activeConfigAddOn: string | null;
  setActiveConfigAddOn: (val: string | null) => void;
  isSheetOpen: boolean;
  setIsSheetOpen: (val: boolean) => void;
  handleConfigureAddOn: (addOnId: string) => void;
  handleSheetOpenChange: (open: boolean) => void;

  // Format & Tone
  formatType: string;
  setFormatType: (val: string) => void;
  toneType: string;
  setToneType: (val: string) => void;
  languageType: string;
  setLanguageType: (val: string) => void;
  styleType: string;
  setStyleType: (val: string) => void;
  previewStyleType: string | null;
  setPreviewStyleType: (val: string | null) => void;
  customBlocks: CustomBlock[];
  setCustomBlocks: (blocks: CustomBlock[]) => void;

  // Data
  user: any;
  brandingData: any;
  servicios: Servicio[];
  isLoadingServices: boolean;
  showServiceSelector: boolean;
  setShowServiceSelector: (val: boolean) => void;
  terms: TermTemplate[];
  loadingTerms: boolean;
  paymentMethods: string[];
  paymentOptions: string[];
  selectedTermId: string | null;
  setSelectedTermId: (val: string | null) => void;
  selectedBankAccount: any;
  setSelectedBankAccount: (val: any) => void;
  userBilling: any;

  // Draft
  draftId: string | null;
  setDraftId: (val: string | null) => void;
  savingDraft: boolean;

  // AI
  aiModalOpen: boolean;
  setAiModalOpen: (val: boolean) => void;
  aiLoading: boolean;
  setAiLoading: (val: boolean) => void;
  aiOptions: string[];
  setAiOptions: (val: string[]) => void;
  paymentModalOpen: boolean;
  setPaymentModalOpen: (val: boolean) => void;
  paymentLoading: boolean;
  setPaymentLoading: (val: boolean) => void;
  paymentOptions2: string[];
  setPaymentOptions2: (val: string[]) => void;
  notesModalOpen: boolean;
  setNotesModalOpen: (val: boolean) => void;
  notesOptions: string[];
  setNotesOptions: (val: string[]) => void;
  notesLoading: boolean;
  setNotesLoading: (val: boolean) => void;

  // Actions
  handleSaveDraft: () => Promise<void>;
  handleGenerateQuote: () => Promise<void>;

  // Canvas (signature)
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;

  // Files
  uploadingFiles: boolean;
  setUploadingFiles: (val: boolean) => void;

  // Templates
  isCreatingTemplate: boolean;
  setIsCreatingTemplate: (val: boolean) => void;
  newTemplateData: { name: string; content: string };
  setNewTemplateData: (val: { name: string; content: string }) => void;
  savingTemplate: boolean;
  setSavingTemplate: (val: boolean) => void;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) throw new Error('useWizard must be used within WizardProvider');
  return context;
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const tipo = params.tipo as string;
  const { user } = useAuth();

  // Validate tipo on mount
  useEffect(() => {
    if (tipo && !VALID_TIPOS.includes(tipo)) {
      router.replace('/cotizacion-estructurada');
    }
  }, [tipo, router]);

  // Wizard Steps
  const [step, setStep] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [activeConfigAddOn, setActiveConfigAddOn] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Draft state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    quotationName: '',
    client: '',
    contextDescription: '',
    clientNeed: '',
    times: '',
    location: '',
    requirements: '',
    payments: tiposConfig[tipo]?.payments || '',
    payment: tiposConfig[tipo]?.payment || '',
    pricingType: tiposConfig[tipo]?.pricingType || 'fix',
    pricing: tiposConfig[tipo]?.pricing || '',
    details: '',
    frequency: '',
    hourlyRate: '',
    estimatedHours: '',
    retainerAmount: '',
    successFee: '',
    projectTotal: '',
    upfrontPayment: '',
    notes: '',
    expirationDate: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    attachments: [] as File[],
    customLanguage: '',
  });

  // Format & Tone
  const [formatType, setFormatType] = useState('detailed');
  const [toneType, setToneType] = useState('formal');
  const [languageType, setLanguageType] = useState('es');
  const [styleType, setStyleType] = useState('despacho_boutique');
  const [previewStyleType, setPreviewStyleType] = useState<string | null>(null);
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>(DEFAULT_CUSTOM_BLOCKS);

  // Data states
  const [brandingData, setBrandingData] = useState<any>(null);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [terms, setTerms] = useState<TermTemplate[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null);
  const [userBilling, setUserBilling] = useState<any>(null);

  // AI states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOptions, setPaymentOptions2] = useState<string[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesOptions, setNotesOptions] = useState<string[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // Canvas & Files
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Templates
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({ name: '', content: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // === USE EFFECTS ===

  // Fetch Branding Info & Contact Info
  useEffect(() => {
    if (!user) return;

    // Set contact info from user
    setFormData(prev => ({
      ...prev,
      contactName: prev.contactName || user.displayName || '',
      contactEmail: prev.contactEmail || user.email || '',
    }));

    // Subscribe to branding changes
    const brandingRef = doc(db, 'brandingInfo', user.uid);
    const unsubscribeBranding = onSnapshot(brandingRef, (docSnap) => {
      if (docSnap.exists()) {
        setBrandingData(docSnap.data());
      }
    });

    // Load user language preference
    const loadUserLanguage = async () => {
      try {
        const settingsRef = doc(db, 'settings', user.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const lang = settingsSnap.data().language;
          if (lang) setLanguageType(lang);
        }
      } catch (err) {
        console.error('Error loading language:', err);
      }
    };
    loadUserLanguage();

    return () => unsubscribeBranding();
  }, [user]);

  // Fetch Services
  useEffect(() => {
    const fetchServicios = async () => {
      if (!user?.uid || !showServiceSelector) return;
      if (servicios.length > 0) return;

      setIsLoadingServices(true);
      try {
        const q = query(collection(db, 'servicios'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const servs: Servicio[] = [];
        querySnapshot.forEach((docItem) => {
          servs.push({ id: docItem.id, ...docItem.data() } as Servicio);
        });
        setServicios(servs);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServicios();
  }, [user, showServiceSelector, servicios.length]);

  // Fetch Terms Templates
  useEffect(() => {
    const fetchTerms = async () => {
      if (!user) return;
      setLoadingTerms(true);
      try {
        const termsRef = collection(db, 'terms_templates');
        const q = query(termsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const termsList: TermTemplate[] = [];
        querySnapshot.forEach((docItem) => {
          termsList.push({ id: docItem.id, ...docItem.data() } as TermTemplate);
        });
        setTerms(termsList);
      } catch (error) {
        console.error('Error fetching terms:', error);
      } finally {
        setLoadingTerms(false);
      }
    };

    if (user && (activeConfigAddOn === 'specific_tc' || activeConfigAddOn === 'general_tc' || activeConfigAddOn === 'privacy_policy')) {
      fetchTerms();
    }
  }, [user, activeConfigAddOn]);

  // Fetch Payment Methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!user) return;
      try {
        const paymentRef = doc(db, 'paymentInfo', user.uid);
        const docSnap = await getDoc(paymentRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.methods && typeof data.methods === 'object') {
            setPaymentMethods(Object.values(data.methods));
          }
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    };

    if (user && activeConfigAddOn === 'bank_account') {
      fetchPaymentMethods();
    }
  }, [user, activeConfigAddOn]);

  // Fetch User Billing Data
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user) return;
      try {
        const billingRef = doc(db, 'billing', user.uid);
        const docSnap = await getDoc(billingRef);
        if (docSnap.exists()) {
          setUserBilling(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching billing data', error);
      }
    };
    fetchBillingData();
  }, [user]);

  // === HANDLERS ===

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfigureAddOn = (addOnId: string) => {
    setActiveConfigAddOn(addOnId);
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setTimeout(() => setActiveConfigAddOn(null), 300);
    }
  };

  // Upload attachments helper
  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const storageRef = ref(storage, `attachments/${user?.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!user?.uid) {
      toast.error('Debes iniciar sesión para guardar un borrador.');
      return;
    }
    setSavingDraft(true);
    try {
      const draftData: any = {
        userId: user.uid,
        clientName: formData.client,
        quotationType: tipo,
        formatType,
        toneType,
        languageType,
        styleType,
        status: 'draft',
        formData,
        selectedAddOns: Array.from(selectedAddOns),
        customBlocks,
        updatedAt: serverTimestamp(),
      };

      if (draftId) {
        await setDoc(doc(db, 'quotations', draftId), draftData, { merge: true });
      } else {
        draftData.createdAt = serverTimestamp();
        draftData.folio = `DRAFT-${Date.now()}`;
        const docRef = await addDoc(collection(db, 'quotations'), draftData);
        setDraftId(docRef.id);
      }
      toast.success('Borrador guardado.');
    } catch (err) {
      console.error('Error saving draft:', err);
      toast.error('Error al guardar borrador.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Generate Quote
  const handleGenerateQuote = async () => {
    // 1. Basic Validation
    if (!formData.client || !formData.pricing) {
      toast.error('Por favor completa los campos obligatorios (Cliente y Precio/Monto).');
      return;
    }

    // 1.5 Add-On Validations
    if (selectedAddOns.has('notes') && !formData.notes?.trim()) {
      toast.error('Agregaste "Notas" pero no escribiste contenido.', { duration: 4000 });
      handleConfigureAddOn('notes');
      return;
    }

    if (selectedAddOns.has('expiration_date') && !formData.expirationDate) {
      toast.error('Agregaste "Fecha de Expiración" pero no seleccionaste una fecha.', { duration: 4000 });
      handleConfigureAddOn('expiration_date');
      return;
    }

    if (selectedAddOns.has('bank_account') && !selectedBankAccount) {
      toast.error('Agregaste "Cuenta Bancaria" pero no seleccionaste ninguna.', { duration: 4000 });
      handleConfigureAddOn('bank_account');
      return;
    }

    if ((selectedAddOns.has('specific_tc') || selectedAddOns.has('general_tc') || selectedAddOns.has('privacy_policy')) && !selectedTermId) {
      toast.error('Agregaste términos pero no seleccionaste una plantilla.', { duration: 4000 });
      const addOn = selectedAddOns.has('specific_tc') ? 'specific_tc' : selectedAddOns.has('general_tc') ? 'general_tc' : 'privacy_policy';
      handleConfigureAddOn(addOn);
      return;
    }

    if (selectedAddOns.has('contact_details') && (!formData.contactName || !formData.contactEmail)) {
      toast.error('Agregaste "Datos de Contacto" pero faltan campos requeridos.', { duration: 4000 });
      handleConfigureAddOn('contact_details');
      return;
    }

    const toastId = toast.loading('Generando cotización...');

    try {
      // Upload attachments if any
      let attachmentURLs: string[] = [];
      if (selectedAddOns.has('attachments') && formData.attachments?.length) {
        toast.loading('Subiendo archivos adjuntos...', { id: toastId });
        attachmentURLs = await uploadAttachments(formData.attachments);
      }

      // Prepare payload
      const payload = {
        clienteNombre: formData.client,
        remitente: formData.client,
        proyecto: formData.quotationName,
        contexto: formData.contextDescription,
        necesidad: formData.clientNeed,
        tiempos: formData.times,
        jurisdiccion: formData.location,
        requerimientos: formData.requirements,
        esquemaDePago: formData.payments,
        metodoDePago: formData.payment,
        precio: formData.pricing,
        detalles: formData.details,
        frecuencia: formData.frequency,
        tarifaPorHora: formData.hourlyRate,
        horasEstimadas: formData.estimatedHours,
        montoRetencion: formData.retainerAmount,
        comisionExito: formData.successFee,
        totalProyecto: formData.projectTotal,
        pagoInicial: formData.upfrontPayment,
        tipo,
        formato: formatType,
        tono: toneType,
        idioma: languageType,
        idiomaCustom: formData.customLanguage,
        estilo: styleType,
        customBlocks: formatType === 'custom' ? customBlocks : undefined,
        userInfo: {
          email: user?.email,
          displayName: user?.displayName,
          uid: user?.uid
        },
        despachoInfo: brandingData || {
          nombre: user?.displayName || 'Despacho Legal',
          slogan: ''
        },
        addOns: {
          notes: selectedAddOns.has('notes') ? formData.notes : null,
          expirationDate: selectedAddOns.has('expiration_date') ? formData.expirationDate : null,
          contactDetails: selectedAddOns.has('contact_details') ? {
            name: formData.contactName,
            email: formData.contactEmail,
            phone: formData.contactPhone
          } : null,
          signature: selectedAddOns.has('signature'),
          attachments: attachmentURLs.length > 0 ? attachmentURLs : null,
          terms: selectedTermId || null,
          bankAccount: selectedBankAccount || null,
          billing: selectedAddOns.has('billing_info') ? userBilling : null,
        }
      };

      // Call API
      const response = await fetch('/api/cotizacion/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error del servidor al generar cotización');
      }

      const data = await response.json();

      // Save to Firestore
      const quotationData: any = {
        userId: user?.uid,
        clientName: formData.client,
        quotationType: tipo,
        formatType,
        toneType,
        languageType,
        styleType,
        status: 'generated',
        content: data.contenido,
        payload,
        createdAt: serverTimestamp(),
        folio: `COT-${Date.now()}`,
      };

      let quotationId: string;
      if (draftId) {
        quotationData.folio = `COT-${Date.now()}`;
        await setDoc(doc(db, 'quotations', draftId), quotationData, { merge: true });
        quotationId = draftId;
        setDraftId(null);
      } else {
        quotationData.createdAt = serverTimestamp();
        quotationData.folio = `COT-${Date.now()}`;
        const quotationRef = await addDoc(collection(db, 'quotations'), quotationData);
        quotationId = quotationRef.id;
      }

      toast.success('¡Cotización generada exitosamente!', { id: toastId });
      router.push(`/cotizacion-estructurada/resultado/${quotationId}`);
    } catch (error) {
      console.error('Error generating quote:', error);
      toast.error('Hubo un error al generar la cotización.', { id: toastId });
    }
  };

  const value: WizardContextType = {
    tipo, step, setStep, formData, setFormData, handleInputChange,
    handleNextStep, handleBackStep,
    selectedAddOns, setSelectedAddOns, activeConfigAddOn, setActiveConfigAddOn,
    isSheetOpen, setIsSheetOpen, handleConfigureAddOn, handleSheetOpenChange,
    formatType, setFormatType, toneType, setToneType,
    languageType, setLanguageType, styleType, setStyleType,
    previewStyleType, setPreviewStyleType,
    customBlocks, setCustomBlocks,
    user, brandingData, servicios, isLoadingServices,
    showServiceSelector, setShowServiceSelector,
    terms, loadingTerms, paymentMethods,
    paymentOptions: paymentOptions,
    selectedTermId, setSelectedTermId,
    selectedBankAccount, setSelectedBankAccount, userBilling,
    draftId, setDraftId, savingDraft,
    aiModalOpen, setAiModalOpen, aiLoading, setAiLoading, aiOptions, setAiOptions,
    paymentModalOpen, setPaymentModalOpen, paymentLoading, setPaymentLoading,
    paymentOptions2: paymentOptions, setPaymentOptions2: setPaymentOptions2,
    notesModalOpen, setNotesModalOpen, notesOptions, setNotesOptions, notesLoading, setNotesLoading,
    handleSaveDraft, handleGenerateQuote,
    canvasRef, isDrawing, setIsDrawing,
    uploadingFiles, setUploadingFiles,
    isCreatingTemplate, setIsCreatingTemplate,
    newTemplateData, setNewTemplateData,
    savingTemplate, setSavingTemplate,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}