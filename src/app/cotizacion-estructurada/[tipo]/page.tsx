'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db, storage } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, doc, onSnapshot, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TermTemplate } from '@/lib/types/terms';
import { PaymentMethod } from '@/lib/types/payment';
import Image from 'next/image';
import AddOnsSelector from './components/AddOnsSelector';
import { toast } from 'react-hot-toast'; // Added toast for notifications
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import RequirementsAIModal from "@/components/modals/RequirementsAIModal";
import PaymentAIModal from "@/components/modals/PaymentAIModal";
import InputGroup, { AIButton } from "@/components/InputGroup";
import {
  SparklesIcon,
  UserIcon,
  BuildingOfficeIcon,
  BoltIcon,
  ClockIcon,
  MapPinIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  PaperClipIcon,
  CalendarIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  DocumentIcon,
  BookOpenIcon,
  FaceSmileIcon,
  BriefcaseIcon,
  ChatBubbleLeftEllipsisIcon,
  GlobeAltIcon,
  LanguageIcon,
  BuildingOffice2Icon,
  RocketLaunchIcon,
  ScaleIcon,
  CogIcon,
  BuildingStorefrontIcon,
  StarIcon,
  ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";


interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: string;
  tiempo: string;
  detalles?: string;
  incluye?: string[];
}

export default function CotizacionEstructuradaForm() {
  const params = useParams();
  const router = useRouter();
  const tipo = params.tipo as string;

  // Wizard Steps: 1 = Form, 2 = Add Ons
  const [step, setStep] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [activeConfigAddOn, setActiveConfigAddOn] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Draft state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  /* State for Dynamic Terms */
  const [termsTemplates, setTermsTemplates] = useState<TermTemplate[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  /* State for Bank and Billing */
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]); // Using any for now to match UI or define type
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string | null>(null);

  const [userBilling, setUserBilling] = useState<any>(null);
  const [billingRequestEnabled, setBillingRequestEnabled] = useState(false);

  // States for AI Modals
  // Needs
  const [needsModalOpen, setNeedsModalOpen] = useState(false);
  const [needsOptions, setNeedsOptions] = useState<string[]>([]);
  const [needsLoading, setNeedsLoading] = useState(false);

  // Times
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [timeOptions, setTimeOptions] = useState<string[]>([]);
  const [timeLoading, setTimeLoading] = useState(false);

  // Requirements
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Payment
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<string[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Notes AI
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesOptions, setNotesOptions] = useState<string[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // Configuraciones por tipo de cotización
  const tiposConfig: Record<string, any> = {
    '1': { // Honorarios Fijos
      pricingType: 'fix',
      payment: 'Pago único por servicio específico',
      payments: 'Un solo pago al completar el servicio',
      pricing: 'Tarifa fija establecida'
    },
    '2': { // Cotización por Hora
      pricingType: 'variable',
      payment: 'Pago basado en horas trabajadas',
      payments: 'Facturación mensual según horas',
      pricing: 'Tarifa por hora multiplicada por tiempo trabajado'
    },
    '3': { // Retainer
      pricingType: 'fix',
      payment: 'Pago mensual anticipado',
      payments: 'Cuota fija mensual',
      pricing: 'Anticipo que cubre servicios futuros durante el período'
    },
    '4': { // Contingencia
      pricingType: 'variable',
      payment: 'Pago basado en resultado exitoso',
      payments: 'Porcentaje del monto recuperado',
      pricing: 'Entre 20-40% del resultado obtenido'
    },
    '5': { // Proyecto
      pricingType: 'fix',
      payment: 'Precio total acordado para el proyecto',
      payments: '50% al inicio, 50% al finalizar',
      pricing: 'Precio fijo por proyecto completo'
    },
    '6': { // Iguala/Suscripción
      pricingType: 'fix',
      payment: 'Cuota mensual o anual',
      payments: 'Pago recurrente mensual/anual',
      pricing: 'Suscripción con servicios ilimitados o con límite de horas'
    }
  };

  // States for Service Selector
  const { user } = useAuth(); // Moved up
  const [brandingData, setBrandingData] = useState<any>(null); // Store branding info
  const [signatureMode, setSignatureMode] = useState<'upload' | 'draw'>('upload');

  // States for Payment Method Creation
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<string>('');
  const [paymentFormData, setPaymentFormData] = useState({
    bank: '',
    clabe: '',
    beneficiary: '',
    cardNumber: '',
    cardHolder: '',
    paypalEmail: '',
    stripeAccount: ''
  });
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);


  // States for inline template creation
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({ name: '', content: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
    // Add-On specific fields
    notes: '',
    expirationDate: '',
    contactName: '', // Initialized empty, will update effect
    contactEmail: '',
    contactPhone: '',
    includeSignature: false,
    includeAttachments: false,
        attachments: [] as File[], // Store actual files
        customLanguage: ''
  });

  // Format & Tone State - Defaults Inteligentes
  const [formatType, setFormatType] = useState<'one-pager' | 'short' | 'large' | 'custom'>('large'); // Default: Detallado (más profesional)
  const [toneType, setToneType] = useState<'friendly' | 'formal'>('formal'); // Default: Formal (más apropiado para B2B)
  const [languageType, setLanguageType] = useState<'es' | 'en' | 'other'>('es'); // Default: Español (mercado principal)
  const [styleType, setStyleType] = useState<'ny-biglaw' | 'silicon-valley' | 'uk-magic-circle' | 'german-engineering' | 'french-cabinet' | 'spanish-boutique' | 'japanese-keigo' | 'swiss-financial' | 'legal-ops' | 'luxury-boutique'>('spanish-boutique'); // Default: Despacho Boutique (más relevante para mercado español)
  const [previewStyleType, setPreviewStyleType] = useState<string | null>(null);

  // Estados para configuración customizada
  interface CustomBlock {
    id: string;
    name: string;
    enabled: boolean;
    detailLevel: 'short' | 'medium' | 'long';
    order: number;
  }

  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([
    { id: 'intro', name: 'Introducción', enabled: true, detailLevel: 'medium', order: 0 },
    { id: 'services', name: 'Alcance de Servicios', enabled: true, detailLevel: 'medium', order: 1 },
    { id: 'process', name: 'Metodología/Proceso', enabled: true, detailLevel: 'short', order: 2 },
    { id: 'timeline', name: 'Cronograma', enabled: false, detailLevel: 'short', order: 3 },
    { id: 'costs', name: 'Costos y Forma de Pago', enabled: true, detailLevel: 'long', order: 4 },
    { id: 'terms', name: 'Términos y Condiciones', enabled: true, detailLevel: 'short', order: 5 },
    { id: 'closing', name: 'Cierre y Firma', enabled: true, detailLevel: 'short', order: 6 },
  ]);

  // Fetch Branding Info
  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to branding changes
    const unsubBranding = onSnapshot(doc(db, 'brandingInfo', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBrandingData({
          nombre: data.nombreDespacho, // Map to expected structure
          slogan: data.slogan,
          logo: data.logoURL,
          direccion: data.direccion, // If we added this
          telefono: data.telefono,
          cargo: data.cargo // If exists
        });
      }
    });

    return () => unsubBranding();
  }, [user?.uid]);

  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Stepper Configuration
  const processSteps = [
    { id: 0, title: 'Tipo de Cobro', status: 'completed' },
    { id: 1, title: 'Detalles del Proyecto', status: step === 1 ? 'current' : 'completed' },
    { id: 2, title: 'Opciones Adicionales', status: step === 2 ? 'current' : (step > 2 ? 'completed' : 'pending') },
    { id: 3, title: 'Formato y Tono', status: step === 3 ? 'current' : 'pending' }
  ];

  // Update contact info when user loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: prev.contactName || user.displayName || '',
        contactEmail: prev.contactEmail || user.email || ''
      }));

      // Fetch Branding Info
      const brandingRef = doc(db, 'brandingInfo', user.uid);
      const unsubscribeBranding = onSnapshot(brandingRef, (docSnap) => {
        if (docSnap.exists()) {
          setBrandingData(docSnap.data());
        }
      });

      // Fetch User Profile for language preference
      const loadUserLanguage = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const idioma = userData.idiomaPreferido || 'es';
            setLanguageType(idioma);
          }
        } catch (error) {
          console.error('Error loading user language:', error);
        }
      };

      loadUserLanguage();

      return () => unsubscribeBranding();
    }
  }, [user]);

  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  useEffect(() => {
    const fetchServicios = async () => {
      if (!user?.uid || !showServiceSelector) return;

      if (servicios.length > 0) return; // Don't refetch if already loaded

      setIsLoadingServices(true);
      try {
        const q = query(
          collection(db, "servicios"),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        const serviciosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.data().nombre || "",
          descripcion: doc.data().descripcion || "",
          precio: doc.data().precio || "",
          tiempo: doc.data().tiempo || "",
          detalles: doc.data().detalles || "",
          incluye: doc.data().incluye || [],
        })) as Servicio[];

        setServicios(serviciosData);
      } catch (error) {
        console.error("Error fetching servicios:", error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServicios();
  }, [user?.uid, showServiceSelector]);

  const handleServiceSelect = (serviceId: string) => {
    const servicio = servicios.find(s => s.id === serviceId);

    if (!servicio) {
      console.warn('Servicio no encontrado:', serviceId);
      return;
    }

    // Auto-completar todos los campos relevantes del formulario
    setFormData(prev => ({
      ...prev,

      // Campo principal: Nombre del proyecto
      quotationName: servicio.nombre || servicio.descripcion,

      // Descripción y contexto del servicio
      contextDescription: servicio.descripcion || '',

      // Tiempo estimado
      times: servicio.tiempo || '',

      // Honorarios/Precio
      pricing: servicio.precio || '',

      // Detalles adicionales del servicio
      details: servicio.detalles || '',

      // Incluye: Convertir array a string separado por saltos de línea
      requirements: servicio.incluye && servicio.incluye.length > 0
        ? servicio.incluye.join('\n')
        : '',
    }));

    // Feedback visual al usuario
    toast.success(`Servicio "${servicio.nombre}" cargado exitosamente`, {
      duration: 3000,
    });

    // Cerrar el selector después de cargar
    setShowServiceSelector(false);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    try {
      const storageRef = ref(storage, `logos/${user.uid}/signature_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Save to Branding Info
      const brandingRef = doc(db, 'brandingInfo', user.uid);
      await setDoc(brandingRef, { signatureURL: url }, { merge: true });
      toast.success("Firma actualizada exitosamente");
    } catch (error) {
      console.error("Error uploading signature", error);
      toast.error("Error al subir la firma");
    }
  };

  // Signature Drawing Functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.closePath();
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveDrawnSignature = async () => {
    if (!user || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      // Check if empty
      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;
      if (canvas.toDataURL() === blank.toDataURL()) {
        toast.error("Por favor dibuja tu firma antes de guardar");
        return;
      }

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const storageRef = ref(storage, `logos/${user.uid}/signature_drawn_${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      // Save to Branding Info
      const brandingRef = doc(db, 'brandingInfo', user.uid);
      await setDoc(brandingRef, { signatureURL: url }, { merge: true });
      toast.success("Firma guardada exitosamente");
      setSignatureMode('upload'); // Switch back to view it
    } catch (error) {
      console.error("Error saving signature", error);
      toast.error("Error al guardar la firma");
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateData.name.trim() || !newTemplateData.content.trim()) {
      toast.error('Nombre y contenido son obligatorios');
      return;
    }
    if (!user?.uid) {
      toast.error('Ocurrió un error (Usuario no identificado)');
      return;
    }

    setSavingTemplate(true);
    try {
      // Determine type based on activeConfigAddOn
      let type = 'GENERAL';
      if (activeConfigAddOn === 'specific_tc') type = 'SPECIFIC';
      else if (activeConfigAddOn === 'privacy_policy') type = 'POLICY';

      await addDoc(collection(db, 'terms_templates'), {
        name: newTemplateData.name,
        content: newTemplateData.content,
        type,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Plantilla creada exitosamente');
      setIsCreatingTemplate(false);
      setNewTemplateData({ name: '', content: '' });
    } catch (error) {
      console.error("Error creating template", error);
      toast.error('Error al crear la plantilla');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSavePaymentMethod = async () => {
    if (!user?.uid) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Validations based on type
    if (selectedPaymentMethodType === 'bank_transfer' || selectedPaymentMethodType === 'bank_account') {
      if (!paymentFormData.beneficiary || !paymentFormData.bank) {
        toast.error('Beneficiario y Banco son obligatorios');
        return;
      }
    }
    if (selectedPaymentMethodType === 'card') {
      if (!paymentFormData.cardNumber || !paymentFormData.cardHolder) {
        toast.error('Número de tarjeta y titular son obligatorios');
        return;
      }
    }
    if (selectedPaymentMethodType === 'paypal' && !paymentFormData.paypalEmail) {
      toast.error('Correo de PayPal obligatorio');
      return;
    }
    if (selectedPaymentMethodType === 'stripe' && !paymentFormData.stripeAccount) {
      toast.error('Cuenta de Stripe obligatoria');
      return;
    }

    try {
      setSavingPaymentMethod(true);
      const id = crypto.randomUUID();

      const newMethod = {
        id,
        type: selectedPaymentMethodType,
        details: { ...paymentFormData },
        isActive: true,
        isDefault: paymentMethods.length === 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const paymentRef = doc(db, 'paymentInfo', user.uid);
      await setDoc(paymentRef, {
        methods: {
          [id]: newMethod
        }
      }, { merge: true });

      setPaymentMethods(prev => [...prev, newMethod]);
      setSelectedBankAccount(JSON.stringify(newMethod));

      // Reset
      setShowPaymentModal(false);
      setSelectedPaymentMethodType('');
      setPaymentFormData({
        bank: '',
        clabe: '',
        beneficiary: '',
        cardNumber: '',
        cardHolder: '',
        paypalEmail: '',
        stripeAccount: ''
      });

      toast.success('Método de pago agregado exitosamente');
    } catch (error) {
      console.error('Error al guardar método:', error);
      toast.error('Error al guardar el método de pago');
    } finally {
      setSavingPaymentMethod(false);
    }
  };

  const availablePaymentMethodTypes = [
    { id: 'bank_transfer', name: 'Transferencia Bancaria', icon: '🏦' },
    { id: 'bank_account', name: 'Cuenta de Banco', icon: '💳' },
    { id: 'card', name: 'Depósito en Tarjeta', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '📱' },
    { id: 'stripe', name: 'Stripe', icon: '💰' }
  ];

  const handleAddOnToggle = (addOnId: string) => {
    const isSelected = selectedAddOns.has(addOnId);

    if (isSelected) {
      // Unselect
      const newSelected = new Set(selectedAddOns);
      newSelected.delete(addOnId);
      setSelectedAddOns(newSelected);

      // If we are currently configuring this one, close the sheet
      if (activeConfigAddOn === addOnId) {
        setIsSheetOpen(false);
      }
    } else {
      // Select AND Open Configuration
      const newSelected = new Set(selectedAddOns);
      newSelected.add(addOnId);
      setSelectedAddOns(newSelected);

      setActiveConfigAddOn(addOnId);
      setIsSheetOpen(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    // Convert FileList to Array
    const files = Array.from(e.target.files);
    const MAX_SIZE_MB = 50;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    // Validate size
    const validFiles = files.filter(file => {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`El archivo "${file.name}" excede el límite de ${MAX_SIZE_MB}MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...validFiles]
      }));
      toast.success(`${validFiles.length} archivo(s) agregado(s).`);
    }

    // Reset input value so same file can be selected again if needed
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const handleConfigureAddOn = (addOnId: string) => {
    setActiveConfigAddOn(addOnId);
    setIsSheetOpen(true);

    // Auto-select the add-on if not selected (without toggling)
    if (!selectedAddOns.has(addOnId)) {
      setSelectedAddOns(prev => {
        const next = new Set(prev);
        next.add(addOnId);
        return next;
      });
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Optional: clear active config after animation
      setTimeout(() => setActiveConfigAddOn(null), 300);
    }
  };

  /* Fetch Terms Templates */
  useEffect(() => {
    const fetchTerms = async () => {
      if (!user) return;

      setLoadingTerms(true);
      try {
        const termsRef = collection(db, 'terms_templates');
        // Assuming we want to fetch terms for the current user
        // If the collection is public/shared, we might not need the 'where' clause
        // For now, let's assuming it's user specific as per "tus plantillas"
        const q = query(termsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const templates: TermTemplate[] = [];
        querySnapshot.forEach((doc) => {
          templates.push({ id: doc.id, ...doc.data() } as TermTemplate);
        });
        setTermsTemplates(templates);
      } catch (error) {
        console.error("Error fetching terms templates:", error);
      } finally {
        setLoadingTerms(false);
      }
    };

    if (user && (activeConfigAddOn === 'specific_tc' || activeConfigAddOn === 'general_tc' || activeConfigAddOn === 'privacy_policy')) {
      fetchTerms();
    }
  }, [user, activeConfigAddOn]);

  /* Fetch Payment Methods */
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!user) return;
      setLoadingPaymentMethods(true);
      try {
        const paymentRef = doc(db, 'paymentInfo', user.uid);
        const docSnap = await getDoc(paymentRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.methods && typeof data.methods === 'object') {
            // Ensure it's an array
            setPaymentMethods(Object.values(data.methods));
          }
        }
      } catch (error) {
        console.error("Error fetching payment methods", error);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    if (user && activeConfigAddOn === 'bank_account') {
      fetchPaymentMethods();
    }
  }, [user, activeConfigAddOn]);


  /* Fetch User Billing Data */
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
        console.error("Error fetching billing data", error);
      }
    };

    if (user && activeConfigAddOn === 'invoicing_info') {
      fetchBillingData();
    }
  }, [user, activeConfigAddOn]);


  /* Sheet Content Renderer */
  const renderAddOnConfigContent = () => {
    switch (activeConfigAddOn) {
      case 'general_tc':
      case 'specific_tc':
      case 'privacy_policy': {
        // Filter templates based on specific selection if needed, or show all
        const filteredTemplates = termsTemplates.filter(t => {
          if (activeConfigAddOn === 'specific_tc') return t.type === 'SPECIFIC';
          if (activeConfigAddOn === 'general_tc') return t.type === 'GENERAL';
          if (activeConfigAddOn === 'privacy_policy') return t.type === 'POLICY';
          return true;
        });

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeConfigAddOn === 'specific_tc' ? 'Términos Específicos' :
                  activeConfigAddOn === 'general_tc' ? 'Términos Generales' : 'Política de Privacidad'}
              </h3>
              <p className="text-sm text-gray-600">Selecciona la plantilla legal para esta sección.</p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Selecciona los Términos y Condiciones
              </label>

              {loadingTerms ? (
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : isCreatingTemplate ? (
                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Nueva Plantilla</h4>
                    <button
                      onClick={() => setIsCreatingTemplate(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={newTemplateData.name}
                        onChange={(e) => setNewTemplateData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full h-12 px-5 py-3.5 border border-gray-200 rounded-full focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 outline-none text-sm text-gray-900 transition-all"
                        placeholder="Ej. Cláusula Estándar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Contenido</label>
                      <textarea
                        value={newTemplateData.content}
                        onChange={(e) => setNewTemplateData(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 outline-none text-sm text-gray-900 resize-y transition-all h-32"
                        placeholder="Escribe el contenido legal aquí..."
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveTemplate}
                        disabled={savingTemplate}
                        className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-full text-sm font-medium hover:from-[#2563EB] hover:to-[#1D4ED8] hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      >
                        {savingTemplate ? 'Guardando...' : 'Guardar Plantilla'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : filteredTemplates.length > 0 ? (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTermId(template.id)}
                      className={`
                        cursor-pointer p-4 rounded-lg border transition-all
                        ${selectedTermId === template.id
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${selectedTermId === template.id ? 'text-blue-900' : 'text-gray-900'}`}>
                          {template.name}
                        </span>
                        {selectedTermId === template.id && (
                          <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <button
                      className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-2"
                      onClick={() => {
                        setIsCreatingTemplate(true);
                        setNewTemplateData({ name: '', content: '' });
                      }}
                    >
                      <span className="text-lg">+</span> Crear nueva plantilla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 flex flex-col items-center text-center">
                  <p className="text-sm mb-3">
                    No tienes plantillas guardadas para esta sección.
                  </p>
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-sm font-medium rounded-full hover:from-[#2563EB] hover:to-[#1D4ED8] hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
                    onClick={() => {
                      setIsCreatingTemplate(true);
                      setNewTemplateData({ name: '', content: '' });
                    }}
                  >
                    Crear primera plantilla
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'bank_account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Métodos de Pago</h3>
              <p className="text-sm text-gray-600">Selecciona el método de pago para recibir pagos de tus clientes.</p>
            </div>

            {loadingPaymentMethods ? (
              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedBankAccount(JSON.stringify(method))}
                    className={`
                            cursor-pointer p-4 rounded-lg border transition-all
                            ${selectedBankAccount === JSON.stringify(method)
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                          `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 text-lg">
                          {
                            method.type === 'bank_transfer' || method.type === 'bank_account' ? '🏛️' :
                              method.type === 'card' ? '💳' :
                                method.type === 'paypal' ? '📱' : '💰'
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {
                              method.details?.beneficiary ||
                              method.details?.cardHolder ||
                              method.details?.bank ||
                              method.details?.name ||
                              'Método de Pago'
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            {
                              method.type === 'card' ? `•••• ${String(method.details?.cardNumber || '').slice(-4)}` :
                                method.type === 'paypal' ? method.details?.paypalEmail :
                                  method.details?.bank ? `${method.details.bank} ••••${String(method.details.accountNumber || method.details.clabe || '').slice(-4)}` :
                                    method.details?.clabe || 'Detalles'
                            }
                          </p>
                        </div>
                      </div>
                      {selectedBankAccount === JSON.stringify(method) && (
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <button
                    className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-2"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <span className="text-lg">+</span> Agregar método de pago
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 flex flex-col items-center text-center">
                <p className="text-sm mb-3">
                  No tienes métodos de pago guardados.
                </p>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-sm font-medium rounded-full hover:from-[#2563EB] hover:to-[#1D4ED8] hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Agregar método de pago
                </button>
              </div>
            )}
          </div>
        );
      case 'invoicing_info':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Datos de Facturación</h3>
              <p className="text-sm text-gray-600">Configura cómo se manejará la información fiscal.</p>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setBillingRequestEnabled(!billingRequestEnabled)}
                className={`
                    cursor-pointer p-4 rounded-lg border transition-all flex items-center justify-between
                    ${billingRequestEnabled
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                  `}
              >
                <div>
                  <p className="font-medium text-gray-900">Solicitar datos fiscales al cliente</p>
                  <p className="text-sm text-gray-500">Incluir un formulario o sección para que el cliente ingrese sus datos de facturación.</p>
                </div>
                <div className={`
                    w-6 h-6 rounded border flex items-center justify-center transition-colors
                    ${billingRequestEnabled ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}
                  `}>
                  {billingRequestEnabled && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>

              {userBilling && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tu Información Fiscal (Emisor)</h4>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-200">
                    <p><span className="font-semibold">Razón Social:</span> {userBilling.razonSocial || 'No definida'}</p>
                    <p><span className="font-semibold">RFC:</span> {userBilling.rfc || 'No definido'}</p>
                  </div>
                  <button
                    className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-800"
                    onClick={() => window.open('/settings/profile', '_blank')}
                  >
                    Editar mis datos fiscales
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center rounded-t-xl">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contenido de la nota</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Opcional</span>
              </div>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Escribe aquí cualquier aclaración importante, condiciones especiales o mensajes personalizados para tu cliente..."
                rows={8}
                className="w-full px-5 py-4 bg-white rounded-b-2xl border-none focus:ring-0 text-gray-700 placeholder:text-gray-400 resize-none text-base leading-relaxed"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={generateNotesSuggestions}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                Mejorar con AI
              </button>
            </div>
          </div>
        );

      case 'expiration_date':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fecha de Expiración</h3>
              <p className="text-sm text-gray-600">Define hasta cuándo es válida esta cotización.</p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal h-12 rounded-xl border-gray-200 ${!formData.expirationDate && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expirationDate ? (
                    format(new Date(formData.expirationDate + 'T12:00:00'), "dd/MM/yyyy")
                  ) : (
                    <span>dd/mm/aaaa</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.expirationDate ? new Date(formData.expirationDate + 'T12:00:00') : undefined}
                  onSelect={(date) => {
                    handleInputChange('expirationDate', date ? format(date, 'yyyy-MM-dd') : '');
                  }}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div >
        );

      case 'contact_details':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 gap-4 p-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre Completo</label>
                    <input
                      type="text"
                      value={formData.contactName || ''}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email Profesional</label>
                    <input
                      type="email"
                      value={formData.contactEmail || ''}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                      placeholder="juan@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.contactPhone || ''}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Estos datos aparecerán en el pie de página de tu cotización.
              </p>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Firma Digital</h3>
              <p className="text-sm text-gray-600">Incluye tu firma digital en el documento.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={formData.includeSignature}
                  onChange={(e) => handleInputChange('includeSignature', e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Incluir espacio para firma</span>
                  <p className="text-xs text-gray-500 mt-0.5">Se generará un bloque para firma al final del PDF.</p>
                </div>
              </label>

              {/* Signature Preview/Config */}
              {formData.includeSignature && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {/* Mode Toggle */}
                  <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setSignatureMode('upload')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${signatureMode === 'upload'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Subir Imagen
                    </button>
                    <button
                      onClick={() => setSignatureMode('draw')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${signatureMode === 'draw'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Dibujar Firma
                    </button>
                  </div>

                  {/* Upload Mode */}
                  {signatureMode === 'upload' && (
                    <div className="space-y-3">
                      {brandingData?.signatureURL ? (
                        <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
                          <div className="relative w-48 h-24 mb-3 border border-gray-200 bg-white rounded-md overflow-hidden">
                            <Image
                              src={brandingData.signatureURL}
                              alt="Firma"
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                          <button
                            onClick={() => document.getElementById('sig-upload')?.click()}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            Cambiar firma
                          </button>
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-center">
                          <p className="text-sm text-orange-800 font-medium mb-3">No tienes una firma configurada</p>
                          <button
                            onClick={() => document.getElementById('sig-upload')?.click()}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                          >
                            Subir Imagen de Firma
                          </button>
                          <p className="text-[10px] text-gray-500 mt-2">Recomendado: Imagen PNG con fondo transparente</p>
                        </div>
                      )}
                      <input
                        type="file"
                        id="sig-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSignatureUpload}
                      />
                    </div>
                  )}

                  {/* Draw Mode */}
                  {signatureMode === 'draw' && (
                    <div className="space-y-4">
                      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white relative">
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={200}
                          className="w-full h-40 touch-none cursor-crosshair"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      <div className="flex justify-between gap-3">
                        <button
                          onClick={clearSignature}
                          className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={saveDrawnSignature}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all"
                        >
                          Guardar Firma
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Dibuja tu firma en el recuadro. Puedes usar el mouse o tu dedo en dispositivos táctiles.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'attachments':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Adjuntos</h3>
              <p className="text-sm text-gray-600">Sube archivos adicionales para anexar a la cotización.</p>
            </div>

            <div
              onClick={() => document.getElementById('file-upload')?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <input
                type="file"
                id="file-upload"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <PaperClipIcon className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">Haz clic para subir archivos</p>
              <p className="text-xs text-gray-500 mt-1">PDF, Documentos, Imágenes (Max 50MB por archivo)</p>
            </div>

            {/* File List */}
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Archivos seleccionados ({formData.attachments.length})</h4>
                {formData.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return <div className="p-4 text-center text-gray-500">Selecciona una opción para configurar</div>;
    }
  };

  // AI Generation Functions
  const generateRequirements = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const response = await fetch("/api/cotizacion/requerimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcionServicio: `${formData.quotationName} ${formData.contextDescription}`,
          necesidadesCliente: formData.clientNeed,
          jurisdiccion: formData.location,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setAiOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias");
      }
    } catch (error) {
      console.error("Error generando requerimientos:", error);
      toast.error("Error al generar sugerencias");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectRequirement = (selected: string[]) => {
    handleInputChange('requirements', selected.join("\n"));
    setAiModalOpen(false);
  };

  const generatePaymentOptions = async () => {
    setPaymentModalOpen(true);
    setPaymentLoading(true);
    try {
      const response = await fetch("/api/cotizacion/forma-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionServicio: `${formData.quotationName} ${formData.contextDescription}` }),
      });
      const data = await response.json();
      if (response.ok) {
        setPaymentOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias de pago");
      }
    } catch (error) {
      console.error("Error generando formas de pago:", error);
      toast.error("Error al generar sugerencias de pago");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSelectPayment = (selected: string) => {
    handleInputChange('payment', selected);
    setPaymentModalOpen(false);
  };

  const generateNeeds = async () => {
    setNeedsModalOpen(true);
    setNeedsLoading(true);
    try {
      const response = await fetch("/api/cotizacion/necesidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionServicio: `${formData.quotationName} ${formData.contextDescription}` }),
      });
      const data = await response.json();
      if (response.ok) {
        setNeedsOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias de necesidades");
      }
    } catch (error) {
      console.error("Error generando necesidades:", error);
      toast.error("Error al generar sugerencias de necesidades");
    } finally {
      setNeedsLoading(false);
    }
  };

  const handleSelectNeeds = (selected: string[]) => {
    handleInputChange('clientNeed', selected.join("\n"));
    setNeedsModalOpen(false);
  };

  const generateTimeEstimation = async () => {
    setTimeModalOpen(true);
    setTimeLoading(true);
    try {
      const response = await fetch("/api/cotizacion/estimacion-tiempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionServicio: `${formData.quotationName} ${formData.contextDescription}` }),
      });
      const data = await response.json();
      if (response.ok) {
        setTimeOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias de tiempo");
      }
    } catch (error) {
      console.error("Error generando estimaciones de tiempo:", error);
      toast.error("Error al generar sugerencias de tiempo");
    } finally {
      setTimeLoading(false);
    }
  };

  const handleSelectTime = (selected: string[]) => {
    handleInputChange('times', selected.join("\n"));
    setTimeModalOpen(false);
  };

  const generateNotesSuggestions = async () => {
    setNotesModalOpen(true);
    setNotesLoading(true);
    try {
      const response = await fetch("/api/cotizacion/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcionServicio: `${formData.quotationName} ${formData.contextDescription}`,
          context: formData.details
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setNotesOptions(data.options || []);
      } else {
        toast.error(data.error || "Error al generar sugerencias de notas");
      }
    } catch (error) {
      console.error("Error generando notas:", error);
      toast.error("Error al generar sugerencias de notas");
    } finally {
      setNotesLoading(false);
    }
  };

  const handleSelectNotes = (selected: string[]) => {
    handleInputChange('notes', selected.join("\n\n")); // Join with double newline for paragraphs
    setNotesModalOpen(false);
  };

  // Upload attachments to Firebase Storage
  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    if (!user?.uid || !files.length) return [];

    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(
        storage,
        `quotations/${user.uid}/attachments/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    });

    return await Promise.all(uploadPromises);
  };


  const handleSaveDraft = async () => {
    if (!user?.uid) {
      toast.error('Debes iniciar sesion para guardar un borrador.');
      return;
    }
    setSavingDraft(true);
    try {
      const draftData: any = {
        userId: user.uid,
        clientName: formData.client,
        quotationType: tipo,
        descripcion: formData.quotationName || formData.contextDescription || 'Borrador sin titulo',
        status: 'draft',
        formDataSnapshot: { ...formData },
        selectedAddOns: Array.from(selectedAddOns),
        step,
        updatedAt: serverTimestamp(),
      };
      if (draftId) {
        await setDoc(doc(db, 'quotations', draftId), draftData, { merge: true });
        toast.success('Borrador actualizado.');
      } else {
        draftData.createdAt = serverTimestamp();
        draftData.folio = `DRAFT-${Date.now()}`;
        const ref = await addDoc(collection(db, 'quotations'), draftData);
        setDraftId(ref.id);
        toast.success('Borrador guardado.');
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      toast.error('Error al guardar borrador.');
    } finally {
      setSavingDraft(false);
    }
  };
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

    // Check terms (checking generic selectedTermId - considering current limitation)
    if ((selectedAddOns.has('specific_tc') || selectedAddOns.has('general_tc') || selectedAddOns.has('privacy_policy')) && !selectedTermId) {
      toast.error('Seleccionaste una opción legal pero no elegiste una plantilla.', { duration: 4000 });
      if (selectedAddOns.has('specific_tc')) handleConfigureAddOn('specific_tc');
      else if (selectedAddOns.has('general_tc')) handleConfigureAddOn('general_tc');
      else handleConfigureAddOn('privacy_policy');
      return;
    }

    if (selectedAddOns.has('contact_details') && (!formData.contactName || !formData.contactEmail)) {
      toast.error('Agregaste "Datos de Contacto" pero faltan campos requeridos.', { duration: 4000 });
      handleConfigureAddOn('contact_details');
      return;
    }

    const toastId = toast.loading('Generando cotización...');

    try {
      // 1. Upload attachments first if any
      let attachmentURLs: string[] = [];
      if (selectedAddOns.has('attachments') && formData.attachments?.length) {
        toast.loading('Subiendo archivos adjuntos...', { id: toastId });
        attachmentURLs = await uploadAttachments(formData.attachments);
      }

      // 2. Prepare complete payload
      const payload = {
        // Client info
        clienteNombre: formData.client,
        remitente: formData.client,

        // Service details
        descripcion: formData.contextDescription || formData.quotationName,
        necesidad: formData.clientNeed,
        tiempo: formData.times,
        precio: formData.pricing,
        formaPago: formData.payment,
        detalles: formData.details,
        ubicacion: formData.location,
        requerimientos: formData.requirements,

        // Format configuration (NEW)
        formatType: formatType,
        toneType: toneType,
        languageType: languageType,
        styleType: styleType, // ADDED: Style for deep generation
        customLanguage: formData.customLanguage || null,
        customBlocks: formatType === 'custom' ? customBlocks : null,

        // User context
        userInfo: {
          email: user?.email,
          displayName: user?.displayName,
          uid: user?.uid
        },

        // Branding (Bug Fix: Use fetched data)
        despachoInfo: brandingData || {
          nombre: user?.displayName || "Despacho Legal",
          slogan: ""
        },

        // Add-Ons
        addOns: {
          notes: selectedAddOns.has('notes') ? formData.notes : null,
          expirationDate: selectedAddOns.has('expiration_date') ? formData.expirationDate : null,
          contactDetails: selectedAddOns.has('contact_details') ? {
            name: formData.contactName,
            email: formData.contactEmail,
            phone: formData.contactPhone
          } : null,
          signature: selectedAddOns.has('signature'),
          attachments: attachmentURLs,
          bankAccount: selectedAddOns.has('bank_account') ? selectedBankAccount : null,
          termsTemplateId: selectedTermId,
          requestBilling: selectedAddOns.has('invoicing_info')
        }
      };

      // Debug: Log what we're sending
      console.log('📊 Branding Data being sent:', {
        brandingData,
        'payload.despachoInfo': payload.despachoInfo,
        'user.displayName': user?.displayName
      });

      // 3. Call backend API
      toast.loading('Generando documento con IA...', { id: toastId });

      const response = await fetch('/api/cotizacion/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error del servidor al generar cotización');
      }

      const data = await response.json();

    // 4. Save to Firestore
      const quotationData: any = {
        userId: user?.uid,
        clientName: formData.client,
        quotationType: tipo,
        formatType,
        toneType,
        languageType,
        styleType, // ADDED: Persist style
        status: 'generated',
        content: data.contenido,
        selectedAddOns: Array.from(selectedAddOns),
        formDataSnapshot: payload, // Guardar el payload completo en lugar de formData crudo
        updatedAt: serverTimestamp(),
      };

      let quotationId: string;

      if (draftId) {
        // Update existing draft → generated
        quotationData.folio = `COT-${Date.now()}`;
        await setDoc(doc(db, 'quotations', draftId), quotationData, { merge: true });
        quotationId = draftId;
        setDraftId(null);
      } else {
        // Create new quotation
        quotationData.folio = `COT-${Date.now()}`;
        quotationData.createdAt = serverTimestamp();
        const quotationRef = await addDoc(collection(db, 'quotations'), quotationData);
        quotationId = quotationRef.id;
      }

      toast.success('¡Cotización generada exitosamente!', { id: toastId });

      // 5. Redirect to result page
      router.push(`/cotizacion-estructurada/resultado/${quotationId}`);

    } catch (error) {
      console.error("Error generating quote:", error);
      toast.error('Hubo un error al generar la cotización.', { id: toastId });
    }
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

  const tiposTitulos: Record<string, string> = {
    '1': 'Honorarios Fijos',
    '2': 'Cotización por Hora',
    '3': 'Retainer',
    '4': 'Contingencia',
    '5': 'Proyecto',
    '6': 'Iguala/Suscripción'
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones para configuración customizada
  const handleToggleBlock = (blockId: string) => {
    setCustomBlocks(prev => prev.map(block =>
      block.id === blockId ? { ...block, enabled: !block.enabled } : block
    ));
  };

  const handleDetailLevelChange = (blockId: string, level: 'short' | 'medium' | 'long') => {
    setCustomBlocks(prev => prev.map(block =>
      block.id === blockId ? { ...block, detailLevel: level } : block
    ));
  };

  const handleReorderBlocks = (fromIndex: number, toIndex: number) => {
    setCustomBlocks(prev => {
      const newBlocks = [...prev];
      const [moved] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, moved);
      return newBlocks.map((block, idx) => ({ ...block, order: idx }));
    });
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    handleReorderBlocks(index, index - 1);
  };

  const moveBlockDown = (index: number) => {
    if (index === customBlocks.length - 1) return;
    handleReorderBlocks(index, index + 1);
  };



  return (
    <div className="min-h-screen bg-gray-50/50 pl-16">
      <div className="w-full px-4 md:px-8 max-w-6xl mx-auto py-8">

        {/* Visual Stepper - Premium Design */}
        <div className="mb-12">
          <div className="relative after:absolute after:inset-x-0 after:top-1/2 after:block after:h-0.5 after:-translate-y-1/2 after:rounded-lg after:bg-gray-100">
            <ol className="relative z-10 flex justify-between text-sm font-medium text-gray-500">
              {processSteps.map((stepItem, stepIdx) => {
                const isCompleted = stepItem.status === 'completed';
                const isCurrent = stepItem.status === 'current';

                return (
                  <li key={stepItem.id} className="flex items-center gap-2 bg-gray-50/50 p-2">
                    <span className={`h-8 w-8 rounded-full border-2 text-center text-[10px]/6 font-bold flex items-center justify-center transition-all duration-200
                                    ${isCompleted ? 'border-blue-600 bg-blue-600 text-white' :
                        isCurrent ? 'border-blue-600 bg-white text-blue-600 shadow-md shadow-blue-500/20' :
                          'border-gray-200 bg-white text-gray-500'}
                                `}>
                      {isCompleted ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        stepItem.id + 1
                      )}
                    </span>
                    <span className={`hidden sm:block ${isCurrent ? 'text-blue-700 font-bold' : isCompleted ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                      {stepItem.title}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push('/cotizacion-estructurada')}
              className="group p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            >
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:-translate-x-1">
                <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{tiposTitulos[tipo] || 'Cotización Estructurada'}</h1>
          </div>
          <p className="text-base text-gray-500 ml-10 max-w-2xl">Completa los detalles para generar una cotización profesional y detallada.</p>
        </div>

        {/* Formulario en cuadrícula 3 columnas */}
        {/* Formulario en cuadrícula 3 columnas */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">

              {/* Proyecto (Custom Card) */}
              <div className="col-span-1 group bg-white rounded-[16px] border border-gray-200 shadow-sm hover:border-blue-200 transition-all duration-200 focus-within:shadow-[0_0_16px_0_rgba(66,153,225,0.15)] hover:shadow-md h-full">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                        <ClipboardDocumentCheckIcon className="w-5 h-5" />
                      </div>
                      <label className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                        Proyecto
                      </label>
                    </div>

                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setShowServiceSelector(false)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${!showServiceSelector ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowServiceSelector(true)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${showServiceSelector ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Servicios
                      </button>
                    </div>
                  </div>

                  {showServiceSelector ? (
                    <div className="relative">
                      {isLoadingServices ? (
                        <div className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-gray-500 text-sm flex items-center gap-2 font-sans">
                          <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"></span>
                          Cargando servicios...
                        </div>
                      ) : servicios.length > 0 ? (
                        <div className="relative">
                          <select
                            onChange={(e) => handleServiceSelect(e.target.value)}
                            className="w-full px-3 py-2 bg-transparent border-none text-sm focus:ring-0 text-gray-900 appearance-none cursor-pointer font-sans"
                            defaultValue=""
                          >
                            <option value="" disabled>Selecciona un servicio guardado</option>
                            {servicios.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre || s.descripcion}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="w-full px-3 py-2 bg-gray-50/50 border border-dashed border-gray-300 rounded-lg text-center">
                          <p className="text-sm text-gray-500 mb-1">No tienes servicios guardados</p>
                          <button
                            type="button"
                            onClick={() => window.open('/settings/profile', '_blank')}
                            className="text-xs text-blue-600 font-semibold hover:underline"
                          >
                            Crear un servicio
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.quotationName}
                      onChange={(e) => handleInputChange('quotationName', e.target.value)}
                      placeholder="Nombre del proyecto o referencia"
                      className="w-full px-3 py-2 bg-transparent border-none text-sm min-h-[42px] focus:ring-0 placeholder-gray-400 text-gray-900 font-sans"
                    />
                  )}
                </div>
              </div>

              {/* Cliente */}
              <div className="col-span-1">
                <InputGroup
                  label="Cliente"
                  placeholder="Nombre del cliente o empresa"
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e)}
                  icon={<UserIcon className="w-5 h-5" />}
                />
              </div>

              {/* Contexto */}
              <div className="col-span-1">
                <InputGroup
                  label="Contexto"
                  placeholder="Describe brevemente el contexto legal..."
                  value={formData.contextDescription}
                  onChange={(e) => handleInputChange('contextDescription', e)}
                  icon={<DocumentTextIcon className="w-5 h-5" />}
                />
              </div>

              {/* Necesidad */}
              <div className="col-span-1">
                <InputGroup
                  label="Necesidad"
                  placeholder="¿Cuál es el dolor o necesidad principal?"
                  value={formData.clientNeed}
                  onChange={(e) => handleInputChange('clientNeed', e)}
                  icon={<BoltIcon className="w-5 h-5" />}
                >
                  <div className="flex justify-end mt-2">
                    <AIButton onClick={generateNeeds} />
                  </div>
                </InputGroup>
              </div>

              {/* Tiempos */}
              <div className="col-span-1">
                <InputGroup
                  label="Tiempos"
                  placeholder="Estimación de tiempo de entrega..."
                  value={formData.times}
                  onChange={(e) => handleInputChange('times', e)}
                  icon={<ClockIcon className="w-5 h-5" />}
                >
                  <div className="flex justify-end mt-2">
                    <AIButton onClick={generateTimeEstimation} />
                  </div>
                </InputGroup>
              </div>

              {/* Jurisdicción */}
              <div className="col-span-1">
                <InputGroup
                  label="Jurisdicción"
                  placeholder=""
                  icon={<MapPinIcon className="w-5 h-5" />}
                >
                  <select
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border-none text-sm focus:ring-0 text-gray-900 appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar jurisdicción</option>
                    <option value="México">México</option>
                    <option value="USA">USA</option>
                  </select>
                </InputGroup>
              </div>

              {/* Requerimientos */}
              <div className="col-span-1">
                <InputGroup
                  label="Requerimientos"
                  placeholder="Lista de entregables o condiciones..."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e)}
                  icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
                >
                  <div className="flex justify-end mt-2">
                    <AIButton onClick={generateRequirements} />
                  </div>
                </InputGroup>
              </div>

              {/* Esquema de Pago */}
              <div className="col-span-1">
                <InputGroup
                  label="Esquema de Pago"
                  placeholder="Detalla los hitos de pago..."
                  value={formData.payments}
                  onChange={(e) => handleInputChange('payments', e)}
                  icon={<CreditCardIcon className="w-5 h-5" />}
                >
                  <div className="h-[38px]" />
                </InputGroup>
              </div>

              {/* Método de Pago */}
              <div className="col-span-1">
                <InputGroup
                  label="Método de Pago"
                  placeholder="Transferencia, tarjeta, etc..."
                  value={formData.payment}
                  onChange={(e) => handleInputChange('payment', e)}
                  icon={<CreditCardIcon className="w-5 h-5" />}
                >
                  <div className="flex justify-end mt-2">
                    <AIButton onClick={generatePaymentOptions} />
                  </div>
                </InputGroup>
              </div>

              {/* Honorarios / Pricing Section */}
              {(() => {
                switch (tipo) {
                  case '4': // Contingencia
                    return (
                      <>
                        <div className="col-span-1">
                          <InputGroup
                            label="% de Éxito"
                            placeholder="Ej. 20"
                            value={formData.successFee}
                            onChange={(e) => handleInputChange('successFee', e)}
                            icon={<div className="w-5 h-5 font-bold text-gray-500 flex items-center justify-center">%</div>}
                          />
                        </div>
                        <div className="col-span-1">
                          <InputGroup
                            label="Monto Estimado"
                            placeholder="Monto base sobre el que aplica"
                            value={formData.pricing}
                            onChange={(e) => handleInputChange('pricing', e)}
                            icon={<CurrencyDollarIcon className="w-5 h-5" />}
                          />
                        </div>
                      </>
                    );
                  case '2': // Hourly
                    return (
                      <div className="col-span-1">
                        <InputGroup
                          label="Honorarios por Hora"
                          placeholder=""
                          icon={<CurrencyDollarIcon className="w-5 h-5" />}
                        >
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Tarifa</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                                <input
                                  type="number"
                                  value={formData.hourlyRate}
                                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Horas</label>
                              <input
                                type="number"
                                value={formData.estimatedHours}
                                onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                                placeholder="Ej. 10"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400 text-sm"
                              />
                            </div>
                          </div>
                          {formData.hourlyRate && formData.estimatedHours && (
                            <div className="mt-3 bg-blue-50 p-2 rounded-lg flex justify-between items-center px-4">
                              <span className="text-sm font-medium text-blue-700">Total Estimado:</span>
                              <span className="text-sm font-bold text-blue-800">
                                ${(parseFloat(formData.hourlyRate) * parseFloat(formData.estimatedHours)).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </InputGroup>
                      </div>
                    );
                  case '6': // Subscription
                    return (
                      <div className="col-span-1">
                        <InputGroup
                          label="Suscripción"
                          placeholder=""
                          icon={<CurrencyDollarIcon className="w-5 h-5" />}
                        >
                          <div className="space-y-4 pt-2">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Monto</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                                <input
                                  type="number"
                                  value={formData.pricing}
                                  onChange={(e) => handleInputChange('pricing', e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400 text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Frecuencia</label>
                              <select
                                value={formData.frequency}
                                onChange={(e) => handleInputChange('frequency', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-gray-900 appearance-none cursor-pointer font-medium text-sm"
                              >
                                <option value="">Seleccionar</option>
                                <option value="Mensual">Mensual</option>
                                <option value="Bimestral">Bimestral</option>
                                <option value="Trimestral">Trimestral</option>
                                <option value="Semestral">Semestral</option>
                                <option value="Anual">Anual</option>
                              </select>
                            </div>
                          </div>
                        </InputGroup>
                      </div>
                    );
                  default: // Standard
                    return (
                      <div className="col-span-1">
                        <InputGroup
                          label="Honorarios"
                          placeholder="Monto total del servicio"
                          value={formData.pricing}
                          onChange={(e) => handleInputChange('pricing', e)}
                          icon={<CurrencyDollarIcon className="w-5 h-5" />}
                        />
                      </div>
                    );
                }
              })()}

              {/* Notas Adicionales */}
              <div className="col-span-1">
                <InputGroup
                  label="Notas Adicionales"
                  placeholder="Cualquier otro detalle relevante..."
                  value={formData.details}
                  onChange={(e) => handleInputChange('details', e)}
                  icon={<DocumentTextIcon className="w-5 h-5" />}
                />
              </div>

            </div>

            {/* Sticky Footer for Actions */}
            <div className="sticky bottom-0 bg-white/100 backdrop-blur-md border-t border-gray-200 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mt-auto">
              <div className="max-w-6xl mx-auto flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/cotizacion-estructurada')}
                  className="px-6 py-2.5 text-sm font-semibold rounded-full transition-all shadow-sm active:scale-95"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="px-6 py-2.5 text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-2"
                >
                  <span>Siguiente paso</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          /* STEP 2: Add Ons */
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <AddOnsSelector
              selectedAddOns={selectedAddOns}
              onToggle={handleAddOnToggle}
              onConfigure={handleConfigureAddOn}
            />

            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
              <SheetContent className="sm:max-w-md w-full p-0 gap-0 overflow-hidden bg-[#F9FAFB]">
                {/* Premium Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${activeConfigAddOn && ['notes', 'signature'].includes(activeConfigAddOn) ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-900'}`}>
                    {activeConfigAddOn === 'notes' && <PencilSquareIcon className="w-6 h-6" />}
                    {activeConfigAddOn === 'attachments' && <PaperClipIcon className="w-6 h-6" />}
                    {activeConfigAddOn === 'expiration_date' && <CalendarIcon className="w-6 h-6" />}
                    {activeConfigAddOn === 'contact_details' && <UserIcon className="w-6 h-6" />}
                    {(activeConfigAddOn === 'specific_tc' || activeConfigAddOn === 'general_tc') && <DocumentTextIcon className="w-6 h-6" />}
                    {activeConfigAddOn === 'privacy_policy' && <ShieldCheckIcon className="w-6 h-6" />}
                    {activeConfigAddOn === 'bank_account' && <BanknotesIcon className="w-6 h-6" />}
                    {activeConfigAddOn === 'invoicing_info' && <ReceiptPercentIcon className="w-6 h-6" />}
                    {activeConfigAddOn === 'signature' && <PencilSquareIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-gray-900">
                      {activeConfigAddOn === 'notes' && 'Notas Adicionales'}
                      {activeConfigAddOn === 'attachments' && 'Adjuntos'}
                      {activeConfigAddOn === 'expiration_date' && 'Fecha de Expiración'}
                      {activeConfigAddOn === 'contact_details' && 'Datos de Contacto'}
                      {activeConfigAddOn === 'specific_tc' && 'Términos Específicos'}
                      {activeConfigAddOn === 'general_tc' && 'Términos Generales'}
                      {activeConfigAddOn === 'privacy_policy' && 'Política de Privacidad'}
                      {activeConfigAddOn === 'bank_account' && 'Cuenta Bancaria'}
                      {activeConfigAddOn === 'invoicing_info' && 'Facturación'}
                      {activeConfigAddOn === 'signature' && 'Firma Digital'}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-gray-500 mt-1">
                      {activeConfigAddOn === 'notes' && 'Agrega detalles puntuales o aclaraciones para el cliente.'}
                      {activeConfigAddOn === 'attachments' && 'Sube documentos complementarios.'}
                      {activeConfigAddOn === 'expiration_date' && 'Define la vigencia de esta propuesta.'}
                      {activeConfigAddOn === 'contact_details' && 'Edita la información de contacto visible.'}
                      {activeConfigAddOn === 'bank_account' && 'Selecciona dónde recibir el pago.'}
                      {['specific_tc', 'general_tc', 'privacy_policy'].includes(activeConfigAddOn || '') && 'Selecciona la plantilla legal adecuada.'}
                    </SheetDescription>
                  </div>
                </div>

                <div className="p-6 h-full overflow-y-auto">
                  {renderAddOnConfigContent()}
                </div>
              </SheetContent>
            </Sheet>

            {/* Action Buttons Step 2 */}
            <div className="flex justify-between items-center mt-8 pb-12 max-w-2xl mx-auto">
              <button
                onClick={handleBackStep}
                className="px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-[#F9FAFB] hover:border-[#9CA3AF] hover:text-gray-900 transition-all shadow-sm active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Atrás</span>
              </button>

              <Button
                onClick={handleNextStep}
                className="px-6 py-2.5 text-sm font-bold rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-2"
              >
                <span>Siguiente Paso</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          /* STEP 3: Format & Tone - Versión Compacta */
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">

              {/* Hint de Configuración Recomendada */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Ya configuramos las opciones más comunes para ti</p>
                  <p className="text-xs text-blue-700">
                    Puedes generar directamente con la configuración recomendada (Detallado, Formal, Español, Despacho Boutique) o personalizar según tus preferencias.
                  </p>
                </div>
              </div>

              {/* Formato de Entrega - Grid Compacto 4 columnas */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Formato de Entrega</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setFormatType('one-pager')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${formatType === 'one-pager' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                  >
                    <DocumentIcon className={`w-6 h-6 ${formatType === 'one-pager' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium text-center ${formatType === 'one-pager' ? 'text-blue-900' : 'text-gray-700'}`}>
                      One Pager
                    </span>
                  </button>

                  <button
                    onClick={() => setFormatType('short')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${formatType === 'short' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                  >
                    <DocumentTextIcon className={`w-6 h-6 ${formatType === 'short' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium text-center ${formatType === 'short' ? 'text-blue-900' : 'text-gray-700'}`}>
                      Corto<br />
                      <span className="text-xs opacity-75">(~500 palabras)</span>
                    </span>
                  </button>

                  <button
                    onClick={() => setFormatType('large')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 relative ${formatType === 'large' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                  >
                    <BookOpenIcon className={`w-6 h-6 ${formatType === 'large' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium text-center ${formatType === 'large' ? 'text-blue-900' : 'text-gray-700'}`}>
                      Detallado<br />
                      <span className="text-xs opacity-75">(+1000 palabras)</span>
                    </span>
                    {formatType === 'large' && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        Recomendado
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setFormatType('custom')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${formatType === 'custom' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                  >
                    <PencilSquareIcon className={`w-6 h-6 ${formatType === 'custom' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium text-center ${formatType === 'custom' ? 'text-blue-900' : 'text-gray-700'}`}>
                      Customizado
                    </span>
                  </button>
                </div>
              </div>

              {/* Configurador Customizado */}
              {formatType === 'custom' && (
                <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Personaliza cada bloque</h3>
                      <p className="text-xs text-gray-600 mt-1">Activa, ordena y ajusta el nivel de detalle de cada sección</p>
                    </div>
                    <span className="text-xs font-medium text-blue-700 bg-white px-3 py-1.5 rounded-full border border-blue-200">
                      {customBlocks.filter(b => b.enabled).length} bloques activos
                    </span>
                  </div>

                  <div className="space-y-2">
                    {customBlocks.map((block, index) => (
                      <div
                        key={block.id}
                        className={`bg-white rounded-xl p-4 border-2 transition-all ${block.enabled
                          ? 'border-gray-200 shadow-sm'
                          : 'border-gray-100 bg-gray-50 opacity-60'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Drag Handle & Checkbox */}
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => moveBlockUp(index)}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Subir"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => moveBlockDown(index)}
                                disabled={index === customBlocks.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Bajar"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="checkbox"
                              checked={block.enabled}
                              onChange={() => handleToggleBlock(block.id)}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all cursor-pointer"
                            />
                          </div>

                          {/* Nombre del Bloque */}
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${block.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                              {block.name}
                            </span>
                          </div>

                          {/* Nivel de Detalle */}
                          {block.enabled && (
                            <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5">
                              <button
                                onClick={() => handleDetailLevelChange(block.id, 'short')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${block.detailLevel === 'short'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                Breve
                              </button>
                              <button
                                onClick={() => handleDetailLevelChange(block.id, 'medium')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${block.detailLevel === 'medium'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                Medio
                              </button>
                              <button
                                onClick={() => handleDetailLevelChange(block.id, 'long')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${block.detailLevel === 'long'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                Extenso
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-600 mt-4 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Usa las flechas para reordenar los bloques según tus preferencias
                  </p>
                </div>
              )}

              {/* Tono - Segment Control */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tono de Comunicación</h2>
                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 max-w-md mx-auto relative">
                  <button
                    onClick={() => setToneType('friendly')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${toneType === 'friendly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <FaceSmileIcon className="w-4 h-4" />
                    <span>Amigable</span>
                  </button>
                  <button
                    onClick={() => setToneType('formal')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 relative ${toneType === 'formal'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>Formal</span>
                    {toneType === 'formal' && (
                      <span className="absolute -top-7 right-0 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        Recomendado
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Idioma - Pills Compactos (3 opciones) */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Idioma del Documento</h2>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setLanguageType('es')}
                      className={`px-6 py-3 rounded-xl border-2 transition-all flex items-center gap-2 relative ${languageType === 'es'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-sm'
                        }`}
                    >
                      <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Español</span>
                      {languageType === 'es' && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                          Recomendado
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setLanguageType('en')}
                      className={`px-6 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${languageType === 'en'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-sm'
                        }`}
                    >
                      <GlobeAltIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Inglés</span>
                    </button>

                    <button
                      onClick={() => setLanguageType('other')}
                      className={`px-6 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${languageType === 'other'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-sm'
                        }`}
                    >
                      <LanguageIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Otro</span>
                    </button>
                  </div>

                  {/* Input para idioma personalizado */}
                  {languageType === 'other' && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        type="text"
                        value={formData.customLanguage || ''}
                        onChange={(e) => handleInputChange('customLanguage', e.target.value)}
                        placeholder="Especifica el idioma (ej: Francés, Portugués, Alemán...)"
                        className="w-full h-12 px-5 py-3.5 bg-gray-50 border-2 border-blue-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-blue-300 transition-all outline-none text-sm font-medium text-gray-900"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Estilo de Cotización - Grid de Cards */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Estilo de Cotización</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">

                  {/* NY BigLaw */}
                  <div
                    onClick={() => setStyleType('ny-biglaw')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'ny-biglaw'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('ny-biglaw');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'ny-biglaw' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <BuildingOffice2Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'ny-biglaw' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          NY BigLaw
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Seguridad, velocidad, contundencia. Minimalista y directo.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Silicon Valley */}
                  <div
                    onClick={() => setStyleType('silicon-valley')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'silicon-valley'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('silicon-valley');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'silicon-valley' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <RocketLaunchIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'silicon-valley' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          Silicon Valley
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Moderno, claro, foco en valor. Estilo product-led SaaS.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Británica */}
                  <div
                    onClick={() => setStyleType('uk-magic-circle')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'uk-magic-circle'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('uk-magic-circle');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'uk-magic-circle' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <ShieldCheckIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'uk-magic-circle' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          Británica
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Formalidad elegante, precisión, calma corporativa.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alemán / Ingeniería Contractual */}
                  <div
                    onClick={() => setStyleType('german-engineering')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'german-engineering'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('german-engineering');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'german-engineering' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <CogIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'german-engineering' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          Ingeniería Contractual
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Rigor, completitud, cero ambigüedad. Estilo alemán.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Francés / Cabinet */}
                  <div
                    onClick={() => setStyleType('french-cabinet')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'french-cabinet'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('french-cabinet');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'french-cabinet' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <BookOpenIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'french-cabinet' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          Cabinet Francés
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Refinamiento, narrativa, claridad conceptual elegante.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/*Español / Despacho Boutique */}
                  <div
                    onClick={() => setStyleType('spanish-boutique')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'spanish-boutique'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('spanish-boutique');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'spanish-boutique' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <BuildingStorefrontIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-sm ${styleType === 'spanish-boutique' ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                            Despacho Boutique
                          </h3>
                          {styleType === 'spanish-boutique' && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                              RECOMENDADO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Cercanía profesional + autoridad técnica. Estilo Madrid.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/*Japonés / Keigo */}
                  <div
                    onClick={() => setStyleType('japanese-keigo')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'japanese-keigo'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('japanese-keigo');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'japanese-keigo' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <ClipboardDocumentCheckIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'japanese-keigo' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          Keigo Japonés
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Respeto, cortesía, precisión. Estructura impecable.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/*Suizo / Financial-grade */}
                  <div
                    onClick={() => setStyleType('swiss-financial')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'swiss-financial'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('swiss-financial');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'swiss-financial' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <BanknotesIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'swiss-financial' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          Financial-grade
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Control, seriedad financiera, orden premium suizo.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/*Legal Ops */}
                  <div
                    onClick={() => setStyleType('legal-ops')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'legal-ops'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('legal-ops');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'legal-ops' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <ClipboardDocumentListIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'legal-ops' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          Legal Ops
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Procurement-friendly, fácil de aprobar internamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/*Luxury / High-end */}
                  <div
                    onClick={() => setStyleType('luxury-boutique')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative cursor-pointer ${styleType === 'luxury-boutique'
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewStyleType('luxury-boutique');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      Ver ejemplo
                    </button>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styleType === 'luxury-boutique' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <SparklesIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm mb-1 ${styleType === 'luxury-boutique' ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          Luxury Boutique
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Exclusividad, atención premium, detalle impecable.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <p className="text-xs text-gray-600 mt-4 text-center flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cada estilo define la estructura, tono y presentación visual de tu cotización
                </p>
              </div>

            </div>

            {/* Action Buttons Step 3 */}
            <div className="flex justify-between items-center mt-8 pb-12">
              <Button
                variant="outline"
                onClick={handleBackStep}
                className="px-6 py-2.5 text-sm font-bold rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Atrás</span>
              </Button>

            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="px-4 py-2.5 text-sm font-medium rounded-full border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{savingDraft ? 'Guardando...' : 'Guardar Borrador'}</span>
            </Button>
              <Button
                onClick={handleGenerateQuote}
                className="px-6 py-2.5 text-sm font-bold rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-2"
              >
                <span>Generar Cotización</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </Button>
            </div>
          </div>
        )
        }
      </div >

      {/* Modals */}
      < RequirementsAIModal
        isOpen={aiModalOpen}
        loading={aiLoading}
        options={aiOptions}
        onClose={() => setAiModalOpen(false)}
        onSelect={handleSelectRequirement}
      />
      <PaymentAIModal
        isOpen={paymentModalOpen}
        loading={paymentLoading}
        options={paymentOptions}
        onClose={() => setPaymentModalOpen(false)}
        onSelect={handleSelectPayment}
      />
      <RequirementsAIModal
        isOpen={needsModalOpen}
        loading={needsLoading}
        options={needsOptions}
        onClose={() => setNeedsModalOpen(false)}
        onSelect={handleSelectNeeds}
        customTitle="Sugerencias de Necesidades del Cliente"
      />
      <RequirementsAIModal
        isOpen={timeModalOpen}
        loading={timeLoading}
        options={timeOptions}
        onClose={() => setTimeModalOpen(false)}
        onSelect={handleSelectTime}
        customTitle="Sugerencias de Tiempo Estimado"
      />
      <RequirementsAIModal
        isOpen={notesModalOpen}
        loading={notesLoading}
        options={notesOptions}
        onClose={() => setNotesModalOpen(false)}
        onSelect={handleSelectNotes}
        customTitle="Sugerencias de Notas Adicionales"
      />

      {/* Modal de Preview de Estilos */}
      {previewStyleType && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-200 p-4"
          onClick={() => setPreviewStyleType(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Vista Previa del Estilo
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Ejemplo de cómo se verá tu cotización con este estilo
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {languageType === 'es' && 'Tu cotización se generará en Español'}
                    {languageType === 'en' && 'Your quote will be generated in English'}
                    {languageType === 'other' && `Tu cotización se generará en ${formData.customLanguage || 'el idioma especificado'}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewStyleType(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 bg-gray-50/50 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">

                {/* NY BigLaw Example */}
                {previewStyleType === 'ny-biglaw' && (
                  <div className="space-y-4 font-sans text-sm">
                    {/* Header */}
                    <div className="text-center pb-4 border-b border-gray-300">
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight">STERLING & ASSOCIATES LLP</h1>
                      <p className="text-xs text-gray-700 mt-1">ATTORNEYS AT LAW</p>
                      <p className="text-xs text-gray-600 mt-2">450 Park Avenue, 32nd Floor | New York, NY 10022</p>
                      <p className="text-xs text-gray-600">Tel: (212) 555-4800 | Fax: (212) 555-4801 | www.sterlinglaw.com</p>
                    </div>

                    {/* Date & Address */}
                    <div className="mt-6 space-y-3">
                      <p className="text-sm text-gray-900">January 23, 2026</p>
                      <div className="text-sm text-gray-900">
                        <p>[Client Name]</p>
                        <p>[Company Name]</p>
                        <p>[Address]</p>
                        <p>[City, State ZIP]</p>
                      </div>
                    </div>

                    {/* Re: line */}
                    <div className="mt-4">
                      <p className="text-sm"><span className="font-bold">Re:</span> Engagement Letter – Corporate Legal Services</p>
                    </div>

                    {/* Salutation */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-900">Dear [Client Name]:</p>
                    </div>

                    {/* Intro paragraph */}
                    <div className="mt-3">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Thank you for engaging Sterling & Associates LLP (the &quot;Firm&quot;) to provide legal services in connection with your corporate matters. This letter confirms the terms of our engagement.
                      </p>
                    </div>

                    {/* Section 1 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">1. SCOPE OF ENGAGEMENT</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        The Firm will provide legal advisory services including contract review, corporate compliance matters, and general business consultation. Our review does not constitute an opinion on the enforceability of any agreements under applicable law.
                      </p>
                    </div>

                    {/* Section 2 - Fees Table */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">2. PROFESSIONAL FEES</h3>
                      <p className="text-sm text-gray-900 mb-3">For the services described above, the Firm will charge a flat fee as follows:</p>

                      <table className="w-full border-collapse border border-gray-400 text-sm">
                        <thead>
                          <tr className="bg-white">
                            <th className="border border-gray-400 px-4 py-2 text-left font-bold text-gray-900">Service Description</th>
                            <th className="border border-gray-400 px-4 py-2 text-right font-bold text-gray-900">Fee (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-4 py-2 text-gray-900">Corporate Legal Advisory Services</td>
                            <td className="border border-gray-400 px-4 py-2 text-right text-gray-900">$15,000.00</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-4 py-2 text-gray-900">Contract Review and Drafting</td>
                            <td className="border border-gray-400 px-4 py-2 text-right text-gray-900">Included</td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-400 px-4 py-2 font-bold text-gray-900">TOTAL</td>
                            <td className="border border-gray-400 px-4 py-2 text-right font-bold text-gray-900">$15,000.00</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-xs text-gray-700 mt-3 leading-relaxed">
                        The flat fee is due upon execution of this engagement letter. Any work beyond the scope described herein will be billed at our standard hourly rates: Partner ($1,450/hour), Senior Associate ($950/hour), Associate ($650/hour).
                      </p>
                    </div>

                    {/* Section 3 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">3. TERMS AND CONDITIONS</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        This engagement is subject to the Firm&apos;s standard terms and conditions, including: (a) conflicts clearance; (b) compliance with anti-money laundering regulations; (c) limitation of liability to fees paid; and (d) confidentiality obligations. The Firm reserves the right to withdraw from representation upon reasonable notice.
                      </p>
                    </div>

                    {/* Section 4 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">4. DELIVERABLES AND TIMELINE</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Upon receipt of payment and necessary documents, the Firm will deliver the review memorandum within three (3) business days. Expedited turnaround (24 hours) is available for an additional fee of $750.
                      </p>
                    </div>

                    {/* Section 5 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">5. ACCEPTANCE</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Please indicate your acceptance of the terms set forth herein by signing and returning a copy of this letter, along with your payment. This engagement letter shall be governed by the laws of the State of New York.
                      </p>
                    </div>

                    {/* Closing */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-900">We appreciate the opportunity to be of service.</p>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-900">Very truly yours,</p>
                    </div>

                    {/* Signature */}
                    <div className="mt-6">
                      <p className="text-sm font-bold text-gray-900">STERLING & ASSOCIATES LLP</p>
                      <div className="mt-8 border-b border-gray-400 w-64"></div>
                      <p className="text-sm text-gray-900 mt-1">Jonathan R. Sterling</p>
                      <p className="text-sm italic text-gray-700">Partner</p>
                    </div>

                    {/* Acceptance */}
                    <div className="mt-8 pt-4">
                      <p className="text-sm font-bold text-gray-900">ACKNOWLEDGED AND AGREED:</p>
                      <div className="mt-6 border-b border-gray-400 w-64"></div>
                      <p className="text-sm text-gray-900 mt-1">[Client Name]</p>
                      <p className="text-sm text-gray-900 mt-3">Date: ______________</p>
                    </div>
                  </div>
                )}

                {/* Silicon Valley Example */}
                {previewStyleType === 'silicon-valley' && (
                  <div className="space-y-5 font-sans text-sm">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          BAXTER GROVE <span className="text-blue-600">LLP</span>
                        </h1>
                        <p className="text-xs text-gray-600 mt-1">Technology & Emerging Companies</p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>555 University Ave, Suite 300</p>
                        <p>Palo Alto, CA 94301</p>
                        <p className="text-blue-600 mt-1">hello@baxtergrove.com</p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="mt-6">
                      <p className="text-sm text-gray-900">January 23, 2026</p>
                    </div>

                    {/* Address block */}
                    <div className="text-sm text-gray-900">
                      <p>[Founder Name]</p>
                      <p>[Company Name]</p>
                      <p>[Email]</p>
                    </div>

                    {/* Re: line */}
                    <div className="mt-4">
                      <p className="text-sm"><span className="font-bold">Re:</span> NDA Review — Fixed Fee Engagement</p>
                    </div>

                    {/* Greeting */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-900">Hi [First Name],</p>
                    </div>

                    {/* Intro */}
                    <div className="mt-3">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Thanks for reaching out. We&apos;re happy to help with your NDA review. Below is our proposal — we&apos;ve kept it simple.
                      </p>
                    </div>

                    {/* What's included section */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 mb-3">What&apos;s included</h3>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 text-sm">→</span>
                          <p className="text-sm text-gray-900">Full review of your NDA (~500 words)</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 text-sm">→</span>
                          <p className="text-sm text-gray-900">Risk assessment memo (plain English, no legalese)</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 text-sm">→</span>
                          <p className="text-sm text-gray-900">Redline with suggested edits</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 text-sm">→</span>
                          <p className="text-sm text-gray-900">15-min call to walk through findings (optional)</p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing section */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 mb-3">Pricing</h3>
                      <table className="w-full text-sm border-collapse">
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-gray-900">NDA Review (standard)</td>
                            <td className="border border-gray-300 px-3 py-2 text-right text-gray-900 font-semibold">$750 flat</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 text-gray-900">Rush delivery (24h turnaround)</td>
                            <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">+$250</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 text-gray-900">Negotiation support (if counterparty pushes back)</td>
                            <td className="border border-gray-300 px-3 py-2 text-right text-gray-900">$350/hr</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="bg-blue-50 border border-blue-300 p-3 rounded mt-4">
                        <p className="text-sm text-blue-900">
                          <span className="font-bold">Early-stage discount:</span> Pre-seed or bootstrapped? We offer 20% off your first engagement. Just let us know.
                        </p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 mb-2">Timeline</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Standard turnaround is 2-3 business days from when we receive the document. Rush is next business day.
                      </p>
                    </div>

                    {/* How we work */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 mb-3">How we work</h3>
                      <p className="text-sm text-gray-900 mb-2">We keep things founder-friendly:</p>
                      <ul className="space-y-1 ml-4">
                        <li className="text-sm text-gray-900">• No billable hour surprises — flat fee means flat fee</li>
                        <li className="text-sm text-gray-900">• Plain English deliverables — you&apos;ll actually understand what we send</li>
                        <li className="text-sm text-gray-900">• Slack/email preferred — skip the formal meetings unless you want them</li>
                        <li className="text-sm text-gray-900">• We&apos;ve reviewed 500+ NDAs for tech companies — we know what matters</li>
                      </ul>
                    </div>

                    {/* Next steps */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 mb-3">Next steps</h3>
                      <ol className="space-y-1 ml-4">
                        <li className="text-sm text-gray-900">1. Reply to this email with the NDA attached</li>
                        <li className="text-sm text-gray-900">2. We&apos;ll send a short engagement letter + payment link</li>
                        <li className="text-sm text-gray-900">3. You&apos;ll have your review in 2-3 days</li>
                      </ol>
                    </div>

                    {/* Questions */}
                    <div className="mt-5">
                      <p className="text-sm text-gray-900">
                        Questions? Just reply to this email or book 15 min: calendly.com/baxtergrove/intro
                      </p>
                    </div>

                    {/* Closing */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-900">Best,</p>
                    </div>

                    {/* Signature */}
                    <div className="mt-3">
                      <p className="text-sm font-bold text-gray-900">Sarah Chen</p>
                      <p className="text-sm text-gray-700">Partner, Baxter Grove LLP</p>
                      <p className="text-sm text-gray-600">sarah@baxtergrove.com  •  (650) 555-0142</p>
                    </div>

                    {/* Disclaimer */}
                    <div className="mt-8 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 italic leading-relaxed">
                        This proposal is valid for 30 days. Full engagement terms provided upon acceptance. Baxter Grove LLP is licensed to practice law in California. This communication does not create an attorney-client relationship.
                      </p>
                    </div>
                  </div>
                )}

                {/* Británica Example */}
                {previewStyleType === 'uk-magic-circle' && (
                  <div className="space-y-4 font-serif text-sm">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-4">
                      <div>
                        <h1 className="text-xl font-bold text-gray-900">ASHWORTH PEMBERTON</h1>
                        <p className="text-xs text-gray-600 italic mt-1">Solicitors</p>
                      </div>
                      <div className="text-right text-xs text-gray-700 leading-relaxed">
                        <p>One Bishops Square</p>
                        <p>London E1 6AD</p>
                        <p>T: +44 (0)20 7946 0958</p>
                        <p>enquiries@ashworthpemberton.com</p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="mt-6">
                      <p className="text-sm text-gray-900">23 January 2026</p>
                    </div>

                    {/* Address block */}
                    <div className="mt-4 text-sm text-gray-900">
                      <p>[Client Name]</p>
                      <p>[Company Name]</p>
                      <p>[Address Line 1]</p>
                      <p>[City, Postcode]</p>
                    </div>

                    {/* Reference */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-700">Our ref: AP/NDA/2026/0147</p>
                    </div>

                    {/* Salutation */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-900">Dear [Client Name]</p>
                    </div>

                    {/* Title */}
                    <div className="mt-4">
                      <p className="text-sm font-bold text-gray-900">Review of Non-Disclosure Agreement</p>
                    </div>

                    {/* Opening paragraph */}
                    <div className="mt-3">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Thank you for instructing Ashworth Pemberton LLP in connection with the above matter. We are pleased to set out below the basis upon which we would propose to act on your behalf.
                      </p>
                    </div>

                    {/* Section 1 */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">1. Background</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        We understand that you are considering entering into a non-disclosure agreement with a prospective counterparty in connection with preliminary commercial discussions. You have requested that we review the proposed agreement to identify any provisions which may be unusual, onerous, or otherwise merit your attention prior to execution.
                      </p>
                    </div>

                    {/* Section 2 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">2. Our Understanding</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        The agreement comprises approximately 500 words and appears to be a standard mutual non-disclosure agreement. We have not been provided with any background materials concerning the proposed transaction, and accordingly our review will be limited to the four corners of the document itself. Should you wish us to consider the agreement in light of any specific commercial context, we would be grateful if you could provide such further information as you consider relevant.
                      </p>
                    </div>

                    {/* Section 3 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">3. Scope of Work</h3>
                      <p className="text-sm text-gray-900 mb-2">Subject to your instructions, we propose to undertake the following:</p>
                      <div className="ml-5 space-y-2 text-sm text-gray-900">
                        <p>(a) review the non-disclosure agreement and identify any provisions which depart from market standard terms or which may present commercial or legal risk;</p>
                        <p>(b) prepare a memorandum summarising our observations and any recommended amendments; and</p>
                        <p>(c) provide a marked-up version of the agreement reflecting suggested revisions.</p>
                      </div>
                      <p className="text-sm text-gray-900 mt-3 leading-relaxed">
                        Our review will not extend to advice on the underlying transaction, tax implications, or the laws of any jurisdiction other than England and Wales. We shall not be advising on the enforceability of any provisions under foreign law.
                      </p>
                    </div>

                    {/* Section 4 - Fees */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">4. Fees</h3>
                      <p className="text-sm text-gray-900 mb-3">We propose to undertake the work described above on a fixed fee basis as follows:</p>

                      <table className="w-full text-sm border-collapse mb-3">
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Review and memorandum</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">£950</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Marked-up agreement</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900 italic">Included</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">VAT (20%)</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">£190</td>
                          </tr>
                          <tr className="font-bold">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Total</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">£1,140</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-xs text-gray-700 leading-relaxed">
                        The above fee assumes a document of the length indicated and does not include any subsequent negotiations with the counterparty. Should you require assistance with negotiations or further correspondence, we would be pleased to discuss appropriate arrangements, which would ordinarily be charged on a time basis at our standard hourly rates (currently £475 per hour for a partner and £325 per hour for an associate).
                      </p>
                    </div>

                    {/* Section 5 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">5. Timing</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Subject to counsel availability, we anticipate being in a position to deliver our memorandum within five working days of receipt of the executed engagement letter and the relevant documentation. Should your matter be time-sensitive, we would be pleased to discuss expedited arrangements.
                      </p>
                    </div>

                    {/* Section 6 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">6. Terms of Engagement</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Our engagement would be subject to our standard terms of business, a copy of which is enclosed for your reference. In particular, we draw your attention to the provisions concerning limitation of liability, which reflect the requirements of our professional indemnity insurers.
                      </p>
                    </div>

                    {/* Section 7 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">7. Regulatory Matters</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Ashworth Pemberton LLP is authorised and regulated by the Solicitors Regulation Authority (SRA number 123456). We are required to comply with the SRA Standards and Regulations, including rules concerning client identification. Accordingly, we may need to verify your identity before commencing work, and we should be grateful if you could provide such documentation as we may reasonably request.
                      </p>
                    </div>

                    {/* Closing */}
                    <div className="mt-5">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        We trust that the foregoing is acceptable. Should you wish to proceed on this basis, we would be grateful if you could confirm your instructions by signing and returning the enclosed copy of this letter. In the meantime, please do not hesitate to contact us should you have any queries.
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-900">Yours sincerely</p>
                    </div>

                    {/* Signature */}
                    <div className="mt-6">
                      <div className="border-b border-gray-400 w-64 mb-1"></div>
                      <p className="text-sm font-bold text-gray-900">James Ashworth</p>
                      <p className="text-sm italic text-gray-700">Partner</p>
                      <p className="text-xs text-gray-700 mt-1">For and on behalf of Ashworth Pemberton LLP</p>
                    </div>

                    {/* Enclosure note */}
                    <div className="mt-6 pt-4">
                      <p className="text-xs italic text-gray-600">Enc: Standard Terms of Business</p>
                    </div>

                    {/* Confirmation box */}
                    <div className="mt-8 border-2 border-gray-400 p-4">
                      <p className="text-sm font-bold text-gray-900 mb-3">Confirmation of Instructions</p>
                      <p className="text-xs text-gray-900 mb-4">
                        I confirm that I wish to instruct Ashworth Pemberton LLP on the terms set out above and in the enclosed Standard Terms of Business.
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-700">Signed: _______________________________</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-700">Name: _______________________________</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-700">Date: _______________________________</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* German Engineering Example */}
                {previewStyleType === 'german-engineering' && (
                  <div className="space-y-4 font-sans text-xs">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-3 border-b border-gray-400">
                      <div>
                        <h1 className="text-base font-bold text-gray-900">WEGNER HARTMANN KRÖGER</h1>
                        <p className="text-xs text-gray-700 mt-0.5">Abogados | Rechtsanwälte PartG mbB</p>
                      </div>
                      <div className="text-right text-xs text-gray-700">
                        <p>Bockenheimer Landstraße 51</p>
                        <p>60325 Frankfurt am Main</p>
                        <p>T: +49 69 7140 8860</p>
                        <p>kanzlei@whk-recht.de</p>
                      </div>
                    </div>

                    {/* Título principal */}
                    <div className="border-2 border-gray-900 p-3 text-center mt-4">
                      <h2 className="text-base font-bold text-gray-900">ACUERDO DE PRESTACIÓN DE SERVICIOS</h2>
                      <p className="text-xs text-gray-600 mt-1 italic">Mandatsvereinbarung / Engagement Letter</p>
                    </div>

                    {/* Información del expediente */}
                    <div className="mt-4 space-y-1">
                      <div className="flex text-xs">
                        <span className="w-40 text-gray-700">N.° de Expediente:</span>
                        <span className="font-medium text-gray-900">WHK/2026/NDA-0147</span>
                      </div>
                      <div className="flex text-xs">
                        <span className="w-40 text-gray-700">Fecha:</span>
                        <span className="text-gray-900">23 de enero de 2026</span>
                      </div>
                      <div className="flex text-xs">
                        <span className="w-40 text-gray-700">Versión:</span>
                        <span className="text-gray-900">1.0</span>
                      </div>
                      <div className="flex text-xs">
                        <span className="w-40 text-gray-700">Estado:</span>
                        <span className="text-gray-900">Borrador para aprobación</span>
                      </div>
                      <div className="flex text-xs">
                        <span className="w-40 text-gray-700">Cliente:</span>
                        <span className="text-gray-900">[Nombre del Cliente / Razón Social]</span>
                      </div>
                      <div className="flex text-xs">
                        <span className="w-40 text-gray-700">Responsable WHK:</span>
                        <span className="text-gray-900">Dr. Martin Wegner, LL.M. (Socio)</span>
                      </div>
                    </div>

                    {/* Sección 1 - DEFINICIONES */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">1. DEFINICIONES</h3>
                      <p className="text-xs text-gray-900 mb-2">Salvo indicación en contrario, los siguientes términos tendrán el significado que se les atribuye a continuación.</p>

                      <table className="w-full text-xs border border-gray-400 mt-2">
                        <tbody>
                          <tr className="bg-gray-100">
                            <td className="border border-gray-400 px-2 py-1.5 font-bold text-gray-900 w-1/3">NDA</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Non-Disclosure Agreement (Acuerdo de Confidencialidad) conforme al Anexo 1</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 font-bold text-gray-900">Objeto de Revisión</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">El NDA proporcionado por el Cliente con una extensión aproximada de 500 palabras</td>
                          </tr>
                          <tr className="bg-gray-100">
                            <td className="border border-gray-400 px-2 py-1.5 font-bold text-gray-900">Informe de Revisión</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Documentación escrita de los resultados de la revisión conforme a la Sección 3.2</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 font-bold text-gray-900">Día Hábil</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Lunes a viernes, excluyendo días festivos oficiales en la jurisdicción aplicable</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 2 */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">2. OBJETO Y OBJETIVOS</h3>
                      <p className="text-xs font-bold text-gray-900 mb-1">2.1 Objeto del Contrato</p>
                      <p className="text-xs text-gray-900 leading-relaxed mb-2">
                        El presente acuerdo tiene como objeto la revisión jurídica de un Acuerdo de Confidencialidad (NDA) para la identificación de riesgos, desviaciones respecto de estándares de mercado, así como la elaboración de propuestas de modificación.
                      </p>

                      <p className="text-xs font-bold text-gray-900 mb-1">2.2 Objetivos</p>
                      <p className="text-xs text-gray-900 ml-3 space-y-0.5">
                        (a) Identificación de riesgos legales y comerciales en el Objeto de Revisión;<br />
                        (b) Evaluación de desviaciones respecto de condiciones contractuales estándar de mercado;<br />
                        (c) Elaboración de recomendaciones concretas y propuestas de redacción alternativa.
                      </p>

                      <p className="text-xs font-bold text-gray-900 mb-1 mt-2">2.3 Limitaciones (Alcance Negativo)</p>
                      <p className="text-xs text-gray-900 mb-1">Los siguientes servicios quedan expresamente excluidos del presente acuerdo:</p>
                      <ul className="text-xs text-gray-900 ml-4 space-y-0.5 list-disc">
                        <li>Asesoría sobre la transacción subyacente o el modelo de negocio;</li>
                        <li>Análisis fiscal o tributario;</li>
                        <li>Revisión conforme a derecho extranjero (salvo encargo específico);</li>
                        <li>Conducción de negociaciones con la contraparte.</li>
                      </ul>
                    </div>

                    {/* Sección 3 - ALCANCE DE SERVICIOS */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">3. ALCANCE DE SERVICIOS (LEISTUNGSUMFANG)</h3>
                      <p className="text-xs font-bold text-gray-900 mb-2">3.1 Actividades de Revisión</p>

                      <table className="w-full text-xs border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-12">N.°</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">Servicio</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-32">Entregable</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">3.1.1</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Revisión formal del NDA: verificación de completitud de elementos esenciales</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Nota de revisión</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">3.1.2</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Análisis sustantivo de las obligaciones de confidencialidad y su alcance</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Análisis de riesgos</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">3.1.3</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Revisión de excepciones (divulgación por autoridades, etc.)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Matriz de evaluación</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">3.1.4</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Análisis de cláusulas de responsabilidad y penas convencionales</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Evaluación de riesgo</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">3.1.5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Revisión de disposiciones de vigencia y terminación</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Nota de revisión</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 4 - SUPUESTOS */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">4. SUPUESTOS Y PRERREQUISITOS</h3>
                      <p className="text-xs text-gray-900 mb-2 leading-relaxed">
                        La prestación de servicios se realiza bajo los siguientes supuestos. Cualquier desviación podrá resultar en ajustes al cronograma y honorarios:
                      </p>

                      <table className="w-full text-xs border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-12">ID</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">Supuesto</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-24">Responsable</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">S-01</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">El Objeto de Revisión se encuentra disponible en idioma español o inglés</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Cliente</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">S-02</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">La extensión del NDA no excede de 500 palabras</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Cliente</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">S-03</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">La documentación completa será proporcionada dentro de los 2 Días Hábiles siguientes al encargo</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Cliente</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 5 - CRONOGRAMA */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">5. CRONOGRAMA E HITOS</h3>

                      <table className="w-full text-xs border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-16">Fase</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">Actividad</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-20">Plazo</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">H-0</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Formalización del encargo y recepción de documentos</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Día 0</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">H-1</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Revisión formal y control de completitud</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Día 1</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">H-2</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Análisis sustantivo y evaluación de riesgos</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Día 2-3</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">H-3</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Elaboración de Informe de Revisión y Markup</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Día 4</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">H-4</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Control de calidad (principio de cuatro ojos)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Día 5</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">H-5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Entrega de documentos al Cliente</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Día 5</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-xs italic text-gray-600 mt-2">
                        Duración total: 5 Días Hábiles desde la recepción completa de documentos. Procesamiento express (2 Días Hábiles) disponible con cargo adicional.
                      </p>
                    </div>

                    {/* Sección 7 - HONORARIOS */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">7. HONORARIOS</h3>
                      <p className="text-xs font-bold text-gray-900 mb-2">7.1 Honorarios Fijos</p>

                      <table className="w-full text-xs border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">Concepto</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-900 w-32">Sin IVA (EUR)</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-900 w-32">Con IVA (EUR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Revisión de NDA incl. Informe (Secc. 3.1, 3.2)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">1.200,00</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">1.428,00</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Matriz de Riesgos (D-03)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900 italic">Incl.</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900 italic">Incl.</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Cargo por servicio express (opcional, 2 Días Hábiles)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">400,00</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">476,00</td>
                          </tr>
                          <tr className="bg-gray-100 font-bold">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">TOTAL (Estándar)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">1.200,00</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">1.428,00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 10 - DISPOSICIONES FINALES */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">10. DISPOSICIONES FINALES</h3>
                      <p className="text-xs text-gray-900 mb-1"><span className="font-bold">10.1</span> Este acuerdo se rige por el derecho alemán.</p>
                      <p className="text-xs text-gray-900 mb-1"><span className="font-bold">10.2</span> Cualquier modificación o adición a este acuerdo deberá constar por escrito.</p>
                      <p className="text-xs text-gray-900"><span className="font-bold">10.3</span> El presente acuerdo tiene vigencia hasta el 23 de febrero de 2026.</p>
                    </div>

                    {/* FIRMAS */}
                    <div className="mt-6 border-2 border-gray-900 p-3">
                      <p className="text-xs font-bold text-gray-900 mb-3">FIRMAS</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-900 mb-2">Por el Despacho:</p>
                          <div className="border-b border-gray-400 mb-1 pb-8"></div>
                          <p className="text-xs text-gray-900">Dr. Martin Wegner</p>
                          <p className="text-xs text-gray-700">Socio</p>
                          <p className="text-xs text-gray-600 mt-2">Lugar, Fecha:_______________</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 mb-2">Por el Cliente:</p>
                          <div className="border-b border-gray-400 mb-1 pb-8"></div>
                          <p className="text-xs text-gray-900">[Nombre]</p>
                          <p className="text-xs text-gray-700">[Cargo]</p>
                          <p className="text-xs text-gray-600 mt-2">Lugar, Fecha:_______________</p>
                        </div>
                      </div>
                    </div>

                    {/* ANEXOS */}
                    <div className="mt-4">
                      <p className="text-xs font-bold text-gray-900 mb-1">ANEXOS</p>
                      <p className="text-xs text-gray-900 ml-3">Anexo 1: Objeto de Revisión (NDA)</p>
                      <p className="text-xs text-gray-900 ml-3">Anexo 2: Aviso de Privacidad conforme al Art. 13 RGPD</p>
                      <p className="text-xs text-gray-900 ml-3">Anexo 3: Condiciones Generales de Contratación</p>
                    </div>
                  </div>
                )}

                {/* French Cabinet Example */}
                {previewStyleType === 'french-cabinet' && (
                  <div className="space-y-4 font-serif text-sm">
                    {/* Header elegante centrado */}
                    <div className="text-center pb-4">
                      <h1 className="text-xl font-bold text-gray-800 tracking-wide">BEAUMONT LEFÈVRE</h1>
                      <p className="text-xs text-gray-500 italic mt-1">— AVOCATS —</p>
                      <p className="text-xs text-gray-600 mt-2">12, avenue Montaigne · 75008 Paris</p>
                    </div>

                    {/* Líneas decorativas */}
                    <div className="flex items-center justify-center gap-4 my-4">
                      <div className="flex-1 border-t border-gray-400"></div>
                      <span className="text-gray-400">✦</span>
                      <div className="flex-1 border-t border-gray-400"></div>
                    </div>

                    {/* Fecha y referencia */}
                    <div className="flex justify-end mb-6">
                      <div className="text-right text-sm text-gray-700">
                        <p>Paris, 23 de enero de 2026</p>
                        <p className="text-xs text-gray-600 mt-1">Ref. BL/2026/C-0147</p>
                      </div>
                    </div>

                    {/* Dirección del cliente */}
                    <div className="mb-4 text-sm text-gray-900">
                      <p>[Nombre del Cliente]</p>
                      <p>[Empresa]</p>
                      <p>[Dirección]</p>
                    </div>

                    {/* Asunto */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">Asunto:</span> <span className="italic">Propuesta de servicios — Revisión de Acuerdo de Confidencialidad</span>
                      </p>
                    </div>

                    {/* Saludo */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-900">Estimado(a) [Nombre]:</p>
                    </div>

                    {/* Párrafo introductorio */}
                    <div className="mb-5">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Agradecemos sinceramente la confianza que deposita en nuestro Cabinet al solicitarnos asistencia en la revisión del acuerdo de confidencialidad que tiene previsto suscribir. Es un placer presentarle nuestra propuesta de intervención.
                      </p>
                    </div>

                    <div className="mb-5">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Hemos tomado debida nota de que el documento en cuestión —de aproximadamente quinientas palabras— tiene por objeto proteger el intercambio de información sensible en el marco de conversaciones preliminares con un potencial socio comercial. Comprendemos la importancia de contar con un análisis riguroso que le permita tomar decisiones informadas antes de comprometer su firma.
                      </p>
                    </div>

                    {/* Separador */}
                    <div className="text-center my-4">
                      <p className="text-gray-400">* * *</p>
                    </div>

                    {/* Sección I */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 text-center mb-4">I. NUESTRA PROPUESTA</h3>
                      <p className="text-sm text-gray-900 leading-relaxed mb-3">
                        Proponemos llevar a cabo un examen exhaustivo del acuerdo de confidencialidad, orientado a tres objetivos fundamentales:
                      </p>

                      <div className="ml-6 space-y-3">
                        <p className="text-sm text-gray-900 leading-relaxed">
                          <span className="italic text-gray-700">Primero</span>, identificar las cláusulas que pudieran presentar un riesgo jurídico o comercial para sus intereses, ya sea por su redacción, su alcance o su eventual interpretación.
                        </p>

                        <p className="text-sm text-gray-900 leading-relaxed">
                          <span className="italic text-gray-700">Segundo</span>, evaluar la conformidad del documento con las prácticas habituales del mercado y los estándares aplicables en materia de confidencialidad empresarial.
                        </p>

                        <p className="text-sm text-gray-900 leading-relaxed">
                          <span className="italic text-gray-700">Tercero</span>, formular propuestas concretas de modificación que fortalezcan su posición, acompañadas de la justificación correspondiente.
                        </p>
                      </div>

                      <p className="text-sm text-gray-900 leading-relaxed mt-4">
                        Al término de nuestra intervención, le remitiremos un informe de síntesis redactado en términos accesibles —sin tecnicismos innecesarios— junto con una versión anotada del documento que refleje nuestras observaciones y sugerencias.
                      </p>
                    </div>

                    {/* Separador */}
                    <div className="text-center my-4">
                      <p className="text-gray-400">* * *</p>
                    </div>

                    {/* Sección II */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 text-center mb-4">II. MODALIDADES DE INTERVENCIÓN</h3>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Equipo asignado.</p>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            El expediente será conducido personalmente por <span className="italic">Maître Élise Beaumont</span>, socia del Cabinet, con el apoyo de un colaborador senior especializado en derecho de los negocios. Esta configuración garantiza tanto la calidad del análisis como la disponibilidad de sus interlocutores.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Plazos.</p>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            Nos comprometemos a entregarle el informe y el documento anotado en un plazo de <span className="italic">cinco días hábiles</span> contados a partir de la recepción del acuerdo de confidencialidad. En caso de urgencia justificada, podemos proponer una entrega acelerada en cuarenta y ocho horas, sujeta a disponibilidad y a un ajuste de honorarios.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Comunicación.</p>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            Privilegiamos un diálogo fluido con nuestros clientes. Quedamos a su entera disposición para una conversación telefónica o videoconferencia de aproximadamente treinta minutos, sin cargo adicional, a fin de comentar nuestras conclusiones y responder sus interrogantes.
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Alcance.</p>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            Conviene precisar que nuestra intervención se circunscribe al análisis del documento proporcionado. No comprende asesoramiento sobre la operación subyacente, consideraciones fiscales ni la revisión conforme a ordenamientos jurídicos distintos al aplicable según el propio acuerdo. Tampoco incluye la conducción de negociaciones con la contraparte, servicio que podríamos ofrecer bajo condiciones separadas si así lo desea.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="text-center my-4">
                      <p className="text-gray-400">* * *</p>
                    </div>

                    {/* Sección III - Honorarios */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 text-center mb-4">III. HONORARIOS</h3>
                      <p className="text-sm text-gray-900 leading-relaxed mb-4">
                        Proponemos una remuneración forfaitaria que brinda a usted certeza sobre el coste de nuestra intervención:
                      </p>

                      {/* Box elegante para el precio */}
                      <div className="border-2 border-gray-400 p-6 my-5">
                        <p className="text-center text-xs text-gray-600 mb-2">Revisión del Acuerdo de Confidencialidad</p>
                        <p className="text-center text-3xl font-bold text-gray-900 mb-2">1.100 €</p>
                        <p className="text-center text-xs text-gray-500 italic">honorarios netos - IVA no aplicable (Art. 261 CGI)</p>
                      </div>

                      <p className="text-sm text-gray-900 leading-relaxed mb-3">
                        Esta cantidad comprende el análisis integral del documento, la redacción del informe de síntesis, la preparación de la versión anotada y una consulta de seguimiento. El pago es exigible a la recepción de nuestra factura, emitida una vez formalizados los términos del encargo.
                      </p>

                      <p className="text-sm text-gray-900 leading-relaxed">
                        En el supuesto de que usted requiriera asistencia adicional —por ejemplo, para acompañarle en las negociaciones o revisar versiones sucesivas del acuerdo— estaríamos encantados de convenir una modalidad de honorarios adaptada a la naturaleza y extensión del trabajo, ya sea sobre base horaria o mediante un nuevo forfait.
                      </p>
                    </div>

                    {/* Separador */}
                    <div className="text-center my-4">
                      <p className="text-gray-400">* * *</p>
                    </div>

                    {/* Sección IV */}
                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 text-center mb-4">IV. CONDICIONES DE COLABORACIÓN</h3>
                      <p className="text-sm text-gray-900 leading-relaxed mb-3">
                        Nuestra relación profesional se regirá por las normas deontológicas aplicables a la profesión de abogado en Francia, en particular el secreto profesional absoluto que ampara toda comunicación entre usted y nuestro Cabinet.
                      </p>

                      <p className="text-sm text-gray-900 leading-relaxed mb-3">
                        De conformidad con la normativa vigente, el Cabinet Beaumont Lefèvre cuenta con un seguro de responsabilidad civil profesional suscrito ante un asegurador de primer rango. Los términos completos de nuestras condiciones generales de prestación de servicios se adjuntan a la presente propuesta.
                      </p>

                      <p className="text-sm text-gray-900 leading-relaxed">
                        Esta propuesta mantiene su validez durante un plazo de treinta días naturales a contar desde la fecha indicada al inicio de este documento.
                      </p>
                    </div>

                    {/* Separador */}
                    <div className="text-center my-4">
                      <p className="text-gray-400">* * *</p>
                    </div>

                    {/* Cierre */}
                    <div className="mt-6">
                      <p className="text-sm text-gray-900 leading-relaxed mb-3">
                        Quedamos a su disposición para cualquier aclaración que pudiera resultar útil. Será un honor poder asistirle en este asunto.
                      </p>

                      <p className="text-sm text-gray-900 leading-relaxed">
                        Le rogamos acepte, estimado(a) [Nombre], la expresión de nuestra más distinguida consideración.
                      </p>
                    </div>

                    {/* Firma */}
                    <div className="mt-8 flex justify-end">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">Maître Élise Beaumont</p>
                        <p className="text-sm italic text-gray-700">Avocate associée</p>
                        <p className="text-xs text-gray-600 mt-1">Cabinet Beaumont Lefèvre</p>
                      </div>
                    </div>

                    {/* Líneas decorativas */}
                    <div className="flex items-center justify-center gap-4 my-6">
                      <div className="flex-1 border-t border-gray-400"></div>
                      <span className="text-gray-400">✦</span>
                      <div className="flex-1 border-t border-gray-400"></div>
                    </div>

                    {/* Box de aceptación */}
                    <div className="mt-8">
                      <p className="text-center text-xs italic text-gray-600 mb-4">— Bon pour accord —</p>

                      <div className="border-2 border-gray-400 p-4">
                        <p className="text-xs text-gray-900 mb-4">
                          El/La suscrito(a) declara aceptar los términos de la presente propuesta y encarga al Cabinet Beaumont Lefèvre la realización de los servicios descritos.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-700">Nombre: ______________________</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-700">Fecha: ______________________</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs text-gray-700">Cargo: ______________________</p>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs text-gray-700">Firma: ______________________</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-gray-300">
                      <p className="text-center text-xs text-gray-500 leading-relaxed">
                        Cabinet Beaumont Lefèvre · Avocats à la Cour<br />
                        12, avenue Montaigne · 75008 Paris · Tél. +33 1 42 56 78 90 · contact@beaumont-lefevre.fr<br />
                        <span className="italic">Barreau de Paris · SELARL au capital de 150.000 € · RCS Paris 812 345 678</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Spanish Boutique Example */}
                {previewStyleType === 'spanish-boutique' && (
                  <div className="space-y-4 font-sans text-sm">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-3 border-b border-gray-400">
                      <div>
                        <h1 className="text-lg font-bold text-red-900">ARÉVALO MONTERO</h1>
                        <p className="text-xs text-gray-700 mt-0.5">ABOGADOS</p>
                      </div>
                      <div className="text-right text-xs text-gray-700">
                        <p>Calle Velázquez, 27 - 4° Dcha.</p>
                        <p>28001 Madrid</p>
                        <p>Tel. 91 435 67 89</p>
                        <p>info@arevalomontero.es</p>
                      </div>
                    </div>

                    {/* Título centrado */}
                    <div className="text-center my-5">
                      <h2 className="text-base font-bold text-red-900">PROPUESTA DE SERVICIOS PROFESIONALES</h2>
                      <p className="text-xs text-gray-600 italic mt-1">Revisión de Acuerdo de Confidencialidad (NDA)</p>
                    </div>

                    {/* Referencia y fecha */}
                    <div className="flex justify-between text-xs mb-4">
                      <div>
                        <p>Ref.: AM/2026/0147</p>
                        <p>Cliente: [Nombre / Razón Social]</p>
                      </div>
                      <div className="text-right">
                        <p>Madrid, 23 de enero de 2026</p>
                      </div>
                    </div>

                    {/* Saludo */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-900">Estimado/a cliente:</p>
                    </div>

                    {/* Párrafo introductorio */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        En atención a la consulta que nos ha formulado, tenemos el agrado de remitirle la presente propuesta de servicios profesionales para la revisión del acuerdo de confidencialidad que tiene previsto suscribir. Agradecemos la confianza depositada en nuestro Despacho.
                      </p>
                    </div>

                    {/* Sección I */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-red-900 mb-2">I. ANTECEDENTES</h3>
                      <p className="text-sm text-gray-900 leading-relaxed mb-2">
                        Según nos ha indicado, su empresa se encuentra en conversaciones preliminares con un potencial socio comercial, habiéndose planteado la necesidad de formalizar un acuerdo de confidencialidad (NDA, por sus siglas en inglés) que proteja la información sensible que pueda intercambiarse durante dichas negociaciones.
                      </p>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        La contraparte le ha remitido un borrador de NDA cuya extensión aproximada es de quinientas palabras, solicitando usted nuestro criterio profesional sobre el contenido del documento antes de proceder a su firma.
                      </p>
                    </div>

                    {/* Sección II */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-red-900 mb-2">II. ALCANCE DEL ENCARGO</h3>
                      <p className="text-sm text-gray-900 mb-2">El presente encargo comprenderá las siguientes actuaciones:</p>
                      <div className="ml-4 space-y-1.5 text-sm text-gray-900">
                        <p><span className="font-semibold">a)</span> Revisión íntegra del documento, verificando su estructura, completitud y coherencia interna.</p>
                        <p><span className="font-semibold">b)</span> Identificación de cláusulas que pudieran resultar desequilibradas, ambiguas o perjudiciales para sus intereses.</p>
                        <p><span className="font-semibold">c)</span> Análisis comparativo con las prácticas habituales de mercado en este tipo de acuerdos.</p>
                        <p><span className="font-semibold">d)</span> Elaboración de un informe con nuestras observaciones y recomendaciones.</p>
                        <p><span className="font-semibold">e)</span> Preparación de una versión anotada del acuerdo con propuestas de modificación, en su caso.</p>
                      </div>
                      <p className="text-sm text-gray-900 mt-3 leading-relaxed">
                        Sin perjuicio de lo anterior, <span className="font-semibold">quedan expresamente excluidos del presente encargo:</span> el asesoramiento sobre la operación comercial subyacente, el análisis de implicaciones fiscales, la revisión conforme a ordenamientos jurídicos distintos al español y la intervención directa en las negociaciones con la contraparte.
                      </p>
                    </div>

                    {/* Sección III - Metodología */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-red-900 mb-2">III. METODOLOGÍA DE TRABAJO</h3>
                      <p className="text-sm text-gray-900 mb-3 leading-relaxed">
                        Una vez formalizado el encargo y recibida la documentación correspondiente, procederemos del siguiente modo:
                      </p>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <tbody>
                          <tr className="bg-red-50">
                            <td className="border border-gray-400 px-3 py-2 font-bold text-gray-900 w-20">Fase 1</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Estudio preliminar del documento y verificación de completitud (Día 1)</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 font-bold text-gray-900">Fase 2</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Análisis sustantivo de las cláusulas e identificación de riesgos (Días 2-3)</td>
                          </tr>
                          <tr className="bg-red-50">
                            <td className="border border-gray-400 px-3 py-2 font-bold text-gray-900">Fase 3</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Redacción del informe y preparación del documento anotado (Día 4)</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 font-bold text-gray-900">Fase 4</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Revisión interna de calidad y entrega de documentación (Día 5)</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-sm text-gray-900 mt-3 leading-relaxed">
                        El plazo estimado de ejecución es, por tanto, de cinco días hábiles desde la recepción del documento. No obstante, en supuestos de especial urgencia, podemos ofrecer un servicio acelerado de cuarenta y ocho horas, sujeto a disponibilidad y al correspondiente ajuste de honorarios.
                      </p>
                    </div>

                    {/* Sección IV */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-red-900 mb-2">IV. EQUIPO RESPONSABLE</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        El encargo será supervisado por <span className="font-bold">D.ª Carmen Arévalo Díaz</span>, socia directora del Despacho y especialista en Derecho mercantil y de los negocios, con más de veinte años de experiencia en el asesoramiento a empresas. El trabajo de análisis será desarrollado por un abogado asociado del área de contratación mercantil, bajo la supervisión directa de la socia.
                      </p>
                    </div>

                    {/* Sección V - Honorarios */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-red-900 mb-2">V. HONORARIOS PROFESIONALES</h3>
                      <p className="text-sm text-gray-900 mb-3 leading-relaxed">
                        Para la prestación de los servicios descritos, proponemos una minuta fija que proporciona a usted certeza sobre el coste total del encargo:
                      </p>

                      <table className="w-full text-sm border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-3 py-2 text-left font-bold text-gray-900">Concepto</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-900 w-28">Base</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-900 w-28">Total*</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Revisión de NDA (informe + documento anotado)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">850,00 €</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">1.028,50 €</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Conferencia de seguimiento (hasta 30 min.)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900 italic">Incluido</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">—</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900 italic">Suplemento servicio urgente (48 h)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">+250,00 €</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">+302,50 €</td>
                          </tr>
                          <tr className="bg-red-900 text-white font-bold">
                            <td className="border border-gray-400 px-3 py-2">TOTAL (servicio estándar)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center">850,00 €</td>
                            <td className="border border-gray-400 px-3 py-2 text-center">1.028,50 €</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-xs text-gray-600 mt-2 italic">* IVA incluido (21%)</p>

                      <p className="text-sm text-gray-900 mt-3 leading-relaxed">
                        En el supuesto de que, una vez emitido nuestro informe, requiriera asistencia adicional —ya sea para intervenir en las negociaciones con la contraparte o para revisar sucesivas versiones del documento—, los servicios complementarios se facturarían conforme a nuestras tarifas horarias habituales: 180 €/hora (socio) y 120 €/hora (abogado asociado), más el IVA correspondiente.
                      </p>
                    </div>

                    {/* Sección VI */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-red-900 mb-2">VI. FORMA DE PAGO</h3>
                      <p className="text-sm text-gray-900 leading-relaxed mb-2">
                        La provisión de fondos correspondiente al importe total de los honorarios (1.028,50 €, IVA incluido) deberá abonarse a la aceptación de la presente propuesta, mediante transferencia bancaria a la cuenta indicada en nuestra factura proforma. Los trabajos se iniciarán una vez confirmada la recepción del pago.
                      </p>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Para clientes con relación continuada, contemplamos la posibilidad de establecer un sistema de facturación mensual a término vencido, previa formalización de las condiciones de crédito oportunas.
                      </p>
                    </div>

                    {/* Sección VII */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-red-900 mb-2">VII. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS</h3>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        La información que nos proporcione será tratada con la más estricta confidencialidad, de conformidad con las obligaciones deontológicas inherentes a nuestra profesión y con lo dispuesto en el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales. Nuestro Despacho cuenta con las medidas técnicas y organizativas adecuadas para garantizar la seguridad de sus datos.
                      </p>
                    </div>

                    {/* Sección VIII */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-red-900 mb-2">VIII. VALIDEZ DE LA PROPUESTA</h3>
                      <p className="text-sm text-gray-900 leading-relaxed mb-3">
                        La presente propuesta mantiene su validez durante un período de treinta días naturales contados desde su fecha de emisión. Transcurrido dicho plazo sin que hayamos recibido su aceptación, entenderemos que ha decidido su interés, sin perjuicio de que pueda contactarnos en cualquier momento para actualizar las condiciones.
                      </p>
                      <p className="text-sm text-gray-900 leading-relaxed mb-2">
                        Quedamos a su entera disposición para ampliar cualquier aspecto de esta propuesta o resolver las dudas que pudieran surgirle. Será un placer poder asistirle en este asunto.
                      </p>
                      <p className="text-sm text-gray-900">
                        Reciba un cordial saludo,
                      </p>
                    </div>

                    {/* Firma */}
                    <div className="mt-6">
                      <p className="text-sm font-bold text-gray-900">Carmen Arévalo Díaz</p>
                      <p className="text-sm italic text-gray-700">Socia Directora</p>
                      <p className="text-xs text-gray-600 mt-0.5">ARÉVALO MONTERO ABOGADOS</p>
                    </div>

                    {/* Box de aceptación */}
                    <div className="mt-8 border-2 border-red-900 p-4">
                      <p className="text-sm font-bold text-red-900 mb-3">ACEPTACIÓN DEL ENCARGO</p>
                      <p className="text-xs text-gray-900 mb-4">
                        El/La abajo firmante manifiesta su conformidad con los términos de la presente propuesta y encarga a ARÉVALO MONTERO ABOGADOS la prestación de los servicios descritos.
                      </p>

                      <div className="space-y-2">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-gray-700">D./D.ª: ______________________</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-700">Fecha: ______________________</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-700">En calidad de: ______________________</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-700">Firma: ______________________</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-3 border-t border-gray-300">
                      <p className="text-center text-xs text-gray-500 leading-relaxed">
                        ARÉVALO MONTERO ABOGADOS, S.L.P. · CIF: B-12345678 · ICAM n.º 12.345<br />
                        Calle Velázquez, 27 - 4° Dcha. · 28001 Madrid · Tel. 91 435 67 89 · info@arevalomontero.es
                      </p>
                    </div>
                  </div>
                )}

                {/* Japanese Keigo Example */}
                {previewStyleType === 'japanese-keigo' && (
                  <div className="space-y-4 font-sans text-sm">
                    {/* Header minimalista derecho */}
                    <div className="flex justify-between items-start">
                      <div></div>
                      <div className="text-right">
                        <h1 className="text-base font-bold text-gray-900">NAKAMURA LEGAL PARTNERS</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Abogados</p>
                        <p className="text-xs text-gray-700 mt-3">23 de enero de 2026</p>
                        <p className="text-xs text-gray-600">N.° NLP-2026-0147</p>
                      </div>
                    </div>

                    {/* Dirección del cliente */}
                    <div className="mt-4 text-sm text-gray-900">
                      <p>[Nombre de la Empresa]</p>
                      <p>[Nombre del Representante]</p>
                    </div>

                    {/* Título centrado */}
                    <div className="text-center my-5 border-t border-b border-gray-400 py-4">
                      <h2 className="text-base font-bold text-gray-900">PROPUESTA DE SERVICIOS</h2>
                      <p className="text-xs text-gray-600 italic mt-1">Revisión de Acuerdo de Confidencialidad</p>
                    </div>

                    {/* Introducción */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Agradecemos sinceramente su consulta. A continuación, presentamos nuestra propuesta para la revisión del acuerdo de confidencialidad solicitado.
                      </p>
                    </div>

                    {/* Sección 1 - Resumen */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">1. Resumen del Servicio</h3>
                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium w-40">Servicio</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Revisión de Acuerdo de Confidencialidad (NDA)</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Documento objeto</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">NDA proporcionado por el cliente (aprox. 500 palabras)</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Plazo de entrega</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">5 días hábiles desde la recepción del documento</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Responsable</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Lic. Kenji Nakamura, Socio Director</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Honorarios</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">¥120,000 (impuestos no incluidos)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 2 - Alcance del Trabajo */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">2. Alcance del Trabajo</h3>
                      <p className="text-xs text-gray-900 mb-2">El presente encargo comprende las siguientes actividades:</p>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-12">N.°</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">Descripción</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-24">Entregable</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">2.1</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Verificación de estructura y completitud del documento</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">2.2</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Análisis de cláusulas de confidencialidad y su alcance</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Informe</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">2.3</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Revisión de excepciones y limitaciones</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Informe</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">2.4</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Evaluación de disposiciones de responsabilidad</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Informe</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">2.5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Análisis de vigencia y terminación</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Informe</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">2.6</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Revisión de ley aplicable y jurisdicción</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Informe</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">2.7</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Elaboración de propuestas de modificación</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Documento anotado</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 3 - Exclusiones */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">3. Exclusiones</h3>
                      <p className="text-xs text-gray-900 mb-2">Los siguientes conceptos no están incluidos en el presente presupuesto:</p>
                      <ul className="text-xs text-gray-900 ml-4 space-y-0.5">
                        <li>× Asesoramiento sobre la transacción comercial subyacente</li>
                        <li>× Análisis de implicaciones fiscales</li>
                        <li>× Revisión conforme a legislación extranjera</li>
                        <li>× Participación en negociaciones con la contraparte</li>
                        <li>× Traducciones del documento</li>
                      </ul>
                    </div>

                    {/* Sección 4 - Entregables */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">4. Entregables</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-12">N.°</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">Documento</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-24">Formato</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-28">Idioma</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">D1</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Informe de revisión con observaciones y recomendaciones</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">PDF</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Español</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">D2</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Documento anotado con propuestas de modificación</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Word</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Idioma original</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">D3</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Tabla resumen de riesgos identificados</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Excel/PDF</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Español</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 5 - Cronograma */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">5. Cronograma</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-16">Día</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">Actividad</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-20">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">0</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Recepción del documento y confirmación</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Inicio</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">1</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Revisión preliminar y verificación de completitud</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">2-3</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Análisis sustantivo de cláusulas</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">4</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Elaboración de informe y documento anotado</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Control de calidad y entrega</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Fin</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-xs italic text-gray-600 mt-2">
                        Nota: Servicio express (48 horas) disponible con cargo adicional de ¥40,000.
                      </p>
                    </div>

                    {/* Sección 6 - Honorarios */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">6. Honorarios</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-3 py-2 text-left font-bold text-gray-900">Concepto</th>
                            <th className="border border-gray-400 px-3 py-2 text-right font-bold text-gray-900 w-28">Importe</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-900 w-32">Observaciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Revisión de NDA (servicio estándar)</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">¥120,000</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">—</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Impuesto al consumo (10%)</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">¥12,000</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">—</td>
                          </tr>
                          <tr className="font-bold">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Total</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">¥132,000</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Impuestos incl.</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-xs text-gray-900 mt-3 mb-2">Servicios adicionales (en caso de ser requeridos):</p>
                      <div className="ml-4 text-xs text-gray-900 space-y-1">
                        <div className="flex justify-between">
                          <span>Apoyo en negociaciones (por hora)</span>
                          <span>¥30,000/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revisión de versiones subsecuentes</span>
                          <span>¥50,000/revisión</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Servicio express (entrega en 48h)</span>
                          <span>+¥40,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conferencia telefónica adicional (por hora)</span>
                          <span>¥15,000/h</span>
                        </div>
                      </div>
                    </div>

                    {/* Sección 7 - Puntos a Confirmar */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">7. Puntos a Confirmar</h3>
                      <p className="text-xs text-gray-900 mb-2">Solicitamos amablemente la confirmación de los siguientes puntos antes del inicio del trabajo:</p>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-12">N.°</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">Punto de confirmación</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-24">Confirmado</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-24">Pendiente</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">C1</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Idioma del documento (español / inglés / otro)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">C2</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Extensión del documento (confirmar aprox. 500 palabras)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">C3</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Jurisdicción aplicable según el NDA</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">C4</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Nivel de urgencia (estándar / express)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">C5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Persona de contacto para consultas</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 8 - Condiciones */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">8. Condiciones</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium w-40">Validez</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">30 días naturales desde la fecha de emisión</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Forma de pago</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Transferencia bancaria previa al inicio del trabajo</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Confidencialidad</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Toda información será tratada con estricta confidencialidad</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Cancelación</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Sin cargo si se notifica antes del inicio. 50% si ya iniciado</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Cierre */}
                    <div className="mt-5">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        Agradecemos nuevamente su confianza. Quedamos a su disposición para cualquier consulta.
                      </p>
                      <p className="text-sm text-gray-900 mt-2">Atentamente,</p>
                    </div>

                    {/* Firma */}
                    <div className="mt-6 flex justify-end">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">NAKAMURA LEGAL PARTNERS</p>
                        <div className="border-b border-gray-400 w-48 mt-6 mb-1"></div>
                        <p className="text-xs text-gray-900">Kenji Nakamura</p>
                        <p className="text-xs italic text-gray-700">Socio Director</p>
                      </div>
                    </div>

                    {/* Box de aceptación */}
                    <div className="mt-8 border-2 border-gray-400 p-4">
                      <p className="text-sm font-bold text-gray-900 mb-3">Aceptación</p>
                      <p className="text-xs text-gray-900 mb-4">
                        El abajo firmante acepta los términos de la presente propuesta y solicita el inicio del servicio.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-700">Empresa: ______________________</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-700">Fecha: ______________________</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-gray-700">Nombre: ______________________</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-700">Firma/Sello: ______________________</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-3 border-t border-gray-300">
                      <p className="text-center text-xs text-gray-500 leading-relaxed">
                        NAKAMURA LEGAL PARTNERS<br />
                        Marunouchi Building 15F, 2-4-1 Marunouchi, Chiyoda-ku, Tokyo 100-6015<br />
                        Tel: +81-3-1234-5678 · info@nakamura-legal.jp
                      </p>
                    </div>
                  </div>
                )}

                {/* Swiss Financial Example */}
                {previewStyleType === 'swiss-financial' && (
                  <div className="space-y-4 font-sans text-xs">
                    {/* Header ultra minimalista */}
                    <div className="flex justify-between items-start pb-3 border-b border-gray-900">
                      <div>
                        <h1 className="text-sm font-bold text-gray-900">SCHREIBER WYSS</h1>
                        <p className="text-xs text-gray-600">RECHTSANWÄLTE | AVOCATS</p>
                      </div>
                      <div className="text-right text-xs text-gray-700">
                        <p>Bahnhofstrasse 42</p>
                        <p>8001 Zürich, Suiza</p>
                        <p>+41 44 123 45 67</p>
                      </div>
                    </div>

                    {/* Metadata en tabla */}
                    <div className="mt-4">
                      <table className="w-full text-xs border border-gray-400">
                        <tbody>
                          <tr className="bg-gray-100">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-700 font-medium w-32">DOCUMENTO</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Propuesta de Servicios</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-700 font-medium w-32">REFERENCIA</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 w-32">SW-2026-0147</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-700 font-medium w-24">FECHA</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 w-32">23.01.2026</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-700 font-medium w-24">VALIDEZ</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 w-20">30 días</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Cliente */}
                    <div className="mt-4">
                      <table className="w-full text-xs border border-gray-400">
                        <tbody>
                          <tr className="bg-gray-100">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-700 font-medium w-32">CLIENTE</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">
                              [Razón Social]<br />
                              [Dirección]
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Servicio principal en caja destacada */}
                    <div className="mt-5 border-2 border-gray-900 p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-700 uppercase mb-1">SERVICIO</p>
                          <p className="text-sm font-bold text-gray-900">Revisión de Acuerdo de Confidencialidad (NDA)</p>
                          <p className="text-xs text-gray-600 mt-1">Documento de aprox. 500 palabras · Plazo 5 días hábiles</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-700 uppercase mb-1">TOTAL</p>
                          <p className="text-2xl font-bold text-gray-900">CHF 1&apos;450.00</p>
                        </div>
                      </div>
                    </div>

                    {/* Sección 1 - Desglose */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">1. DESGLOSE DE HONORARIOS</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900 w-12">N.°</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold text-gray-900">CONCEPTO</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-24">UNIDAD</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold text-gray-900 w-20">TARIFA</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-right font-bold text-gray-900 w-24">IMPORTE</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">1.1</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Análisis jurídico del documento</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Forfait</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">950.00</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">1.2</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Informe de riesgos y recomendaciones</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Incluido</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">—</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">1.3</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Documento anotado (markup)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Incluido</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">—</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">1.4</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Control de calidad (4 ojos)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Incluido</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">—</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">1.5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Consulta de seguimiento (hasta 30 min)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Incluido</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">—</td>
                          </tr>
                          <tr className="bg-gray-100">
                            <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right font-medium text-gray-900">Subtotal</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right font-medium text-gray-900">CHF 950.00</td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="border border-gray-400 px-2 py-1.5 text-gray-900">Gastos administrativos</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Forfait</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">—</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">50.00</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right font-medium text-gray-900">Base imponible</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right font-medium text-gray-900">CHF 1&apos;000.00</td>
                          </tr>
                          <tr>
                            <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">IVA (8.1%)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">CHF 81.00</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">Tasa administrativa cantonal</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">CHF 19.00</td>
                          </tr>
                          <tr>
                            <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">Redondeo</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right text-gray-900">CHF 0.00</td>
                          </tr>
                          <tr className="bg-gray-900 text-white">
                            <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right font-bold text-sm">TOTAL A PAGAR</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-right font-bold text-base">CHF 1&apos;450.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 2 - Condiciones de pago */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">2. CONDICIONES DE PAGO</h3>

                      <table className="w-full text-xs border border-gray-400">
                        <tbody>
                          <tr className="bg-gray-100">
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-700 font-medium w-32">IMPORTE</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-700 font-medium w-32">PLAZO</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-700 font-medium">MÉTODO</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900 font-semibold">Franco Suizo (CHF)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">15 días neto</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Transferencia bancaria</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Datos bancarios */}
                      <div className="mt-3 border border-gray-400 p-3 bg-gray-50">
                        <p className="text-xs font-bold text-gray-900 mb-2">DATOS BANCARIOS</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex">
                            <span className="w-24 text-gray-700">Beneficiario:</span>
                            <span className="text-gray-900">Schreiber Wyss Rechtsanwälte AG</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-gray-700">Banco:</span>
                            <span className="text-gray-900">Credit Suisse AG, Zürich</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-gray-700">IBAN:</span>
                            <span className="text-gray-900">CH83 0483 5012 3456 7800 0</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-gray-700">BIC/SWIFT:</span>
                            <span className="text-gray-900">CRESCHZZ80A</span>
                          </div>
                          <div className="flex">
                            <span className="w-24 text-gray-700">Referencia:</span>
                            <span className="text-gray-900">SW-2026-0147</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección 3 - Supuestos */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">3. SUPUESTOS Y CONDICIONES</h3>

                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-mono">☑</span>
                          <p className="text-xs text-gray-900 flex-1">El documento no excede de 500 palabras</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-mono">☑</span>
                          <p className="text-xs text-gray-900 flex-1">El documento está redactado en español, inglés, alemán o francés</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-mono">☑</span>
                          <p className="text-xs text-gray-900 flex-1">No se requiere análisis conforme a legislación extranjera</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-mono">☑</span>
                          <p className="text-xs text-gray-900 flex-1">El cliente proporcionará el documento dentro de 48h desde la aceptación</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-mono">☑</span>
                          <p className="text-xs text-gray-900 flex-1">Los plazos se computan en días hábiles (lunes a viernes, excl. festivos ZH)</p>
                        </div>
                      </div>

                      <p className="text-xs italic text-gray-600 mt-3">
                        El incumplimiento de cualquier supuesto podrá resultar en ajuste de plazos y/o honorarios, previa comunicación.
                      </p>
                    </div>

                    {/* Sección 4 - Exclusiones */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">4. EXCLUSIONES</h3>

                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500">—</span>
                          <p className="text-xs text-gray-900 flex-1">Asesoramiento sobre la transacción subyacente</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500">—</span>
                          <p className="text-xs text-gray-900 flex-1">Análisis fiscal o tributario</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500">—</span>
                          <p className="text-xs text-gray-900 flex-1">Revisión conforme a derecho de terceros países</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500">—</span>
                          <p className="text-xs text-gray-900 flex-1">Negociación con contraparte</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500">—</span>
                          <p className="text-xs text-gray-900 flex-1">Traducción de documentos</p>
                        </div>
                      </div>
                    </div>

                    {/* Sección 5 - Servicios opcionales */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">5. SERVICIOS OPCIONALES</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-400 px-3 py-2 text-left font-bold text-gray-900">ACTIVIDAD</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-900 w-28">TARIFA</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-900 w-24">UNIDAD</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Entrega express (48 horas)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">CHF 400.00</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Forfait</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Apoyo en negociación</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">CHF 450.00</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Por hora</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Revisión de versiones adicionales</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">CHF 350.00</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Por versión</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Conferencia adicional</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">CHF 250.00</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Por hora</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 6 - Términos generales */}
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">6. TÉRMINOS GENERALES</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium w-40">Ley aplicable</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Derecho suizo</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Jurisdicción</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Tribunales de Zürich, Suiza</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Confidencialidad</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Secreto profesional conforme a art. 321 CP suizo</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Responsabilidad</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Limitada a CHF 2&apos;000&apos;000 por mandato</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Cancelación</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Sin cargo antes del inicio. 50% si ya iniciado</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Seguro RC</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Póliza vigente con [Aseguradora], n.° [XXXX]</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Firmas en tabla */}
                    <div className="mt-6 border-t-2 border-gray-900 pt-4">
                      <table className="w-full text-xs">
                        <tbody>
                          <tr>
                            <td className="w-1/2 pr-4 align-top">
                              <p className="text-xs font-bold text-gray-900 mb-2">POR EL DESPACHO</p>
                              <p className="text-sm font-bold text-gray-900 mt-6">Schreiber Wyss Rechtsanwälte AG</p>
                              <div className="border-b border-gray-400 w-48 mt-8 mb-1"></div>
                              <p className="text-xs text-gray-900">Dr. Thomas Schreiber, Socio</p>
                              <p className="text-xs text-gray-600 mt-2">Fecha: 23.01.2026</p>
                            </td>
                            <td className="w-1/2 pl-4 align-top border-l border-gray-400">
                              <p className="text-xs font-bold text-gray-900 mb-2">POR EL CLIENTE</p>
                              <p className="text-sm text-gray-900 mt-6">[Razón Social]</p>
                              <div className="border-b border-gray-400 w-48 mt-8 mb-1"></div>
                              <p className="text-xs text-gray-700">Nombre: ______________________</p>
                              <p className="text-xs text-gray-700 mt-2">Fecha: ______________________</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-3 border-t border-gray-400">
                      <p className="text-xs text-gray-500 text-center leading-relaxed">
                        Schreiber Wyss Rechtsanwälte AG<br />
                        CHE-123.456.789<br />
                        Registro Mercantil Zürich · UID: CHF 150&apos;000<br />
                        IVA: CHE-123.456.789 MWST · www.schreiberwyss.ch
                      </p>
                    </div>
                  </div>
                )}

                {/* Legal Ops Example */}
                {previewStyleType === 'legal-ops' && (
                  <div className="space-y-0 font-sans text-xs">
                    {/* Header oscuro tipo formulario */}
                    <div className="bg-gray-900 text-white p-3 -m-8 mb-0 flex justify-between items-center">
                      <div>
                        <h1 className="text-base font-bold">MERIDIAN LEGAL</h1>
                        <p className="text-xs opacity-80">Enterprise Legal Services</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">SERVICE ORDER FORM</p>
                      </div>
                    </div>

                    {/* Metadata grid */}
                    <div className="mt-4 bg-gray-100 p-3 border border-gray-400">
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-gray-600 text-[10px] uppercase">Job Number</p>
                          <p className="font-semibold text-gray-900">ML-2026-0147</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-[10px] uppercase">Issue Date</p>
                          <p className="font-semibold text-gray-900">2026-01-23</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-[10px] uppercase">Valid Until</p>
                          <p className="font-semibold text-gray-900">2026-02-22</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-[10px] uppercase">Version</p>
                          <p className="font-semibold text-gray-900">1.0</p>
                        </div>
                      </div>
                    </div>

                    {/* Provider y Client */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="border border-gray-400 p-3 bg-white">
                        <p className="text-[10px] text-gray-600 uppercase mb-1">SERVICE PROVIDER</p>
                        <p className="text-xs font-bold text-gray-900">Meridian Legal Services, LLC</p>
                        <p className="text-xs text-gray-700">100 Legal Center Drive, Suite 500</p>
                        <p className="text-xs text-gray-700">Chicago, IL 60601, USA</p>
                      </div>
                      <div className="border border-gray-400 p-3 bg-white">
                        <p className="text-[10px] text-gray-600 uppercase mb-1">CLIENT</p>
                        <p className="text-xs font-bold text-gray-900">[Client Legal Entity Name]</p>
                        <p className="text-xs text-gray-700">[Address]</p>
                        <p className="text-xs text-gray-700">[City, State/Country, ZIP]</p>
                      </div>
                    </div>

                    {/* Sección 1 - Service Summary */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">1. SERVICE SUMMARY</h3>

                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 text-gray-700 font-medium w-40">Service Name</td>
                            <td className="py-2 text-gray-900">NDA Review Service</td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 text-gray-700 font-medium">Service Category</td>
                            <td className="py-2 text-gray-900">Contract Review & Analysis</td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 text-gray-700 font-medium">Service Type</td>
                            <td className="py-2 text-gray-900">Fixed Fee Engagement</td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 text-gray-700 font-medium">Document Scope</td>
                            <td className="py-2 text-gray-900">Single NDA, approximately 500 words</td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 text-gray-700 font-medium">Delivery Timeline</td>
                            <td className="py-2 text-gray-900">5 business days from document receipt</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-gray-700 font-medium">Service Term</td>
                            <td className="py-2 text-gray-900">One-time engagement</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 2 - Scope Definition */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">2. SCOPE DEFINITION</h3>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-green-50 border border-green-300 p-3">
                          <p className="text-xs font-bold text-green-800 mb-2">✓ INCLUDED IN SCOPE</p>
                          <ul className="space-y-1 text-xs text-gray-900">
                            <li>✓ Complete legal review of NDA</li>
                            <li>✓ Risk assessment and classification</li>
                            <li>✓ Deviation analysis vs. market standard</li>
                            <li>✓ Written findings report (PDF)</li>
                            <li>✓ Annotated document with markup (Word)</li>
                            <li>✓ Risk matrix summary (Excel)</li>
                            <li>✓ One 30-minute follow-up call</li>
                            <li>✓ Quality assurance review</li>
                          </ul>
                        </div>
                        <div className="bg-red-50 border border-red-300 p-3">
                          <p className="text-xs font-bold text-red-800 mb-2">✗ NOT INCLUDED IN SCOPE</p>
                          <ul className="space-y-1 text-xs text-gray-900">
                            <li>✗ Advice on underlying transaction</li>
                            <li>✗ Tax or regulatory analysis</li>
                            <li>✗ Foreign law review</li>
                            <li>✗ Negotiation with counterparty</li>
                            <li>✗ Document translations</li>
                            <li>✗ Litigation support</li>
                            <li>✗ Subsequent version reviews</li>
                            <li>✗ On-site meetings</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Sección 3 - Deliverables */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">3. DELIVERABLES</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400 mt-2">
                        <thead className="bg-gray-900 text-white">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold w-12">ID</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">DELIVERABLE</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold w-24">FORMAT</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold w-20">DELIVERY</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold w-40">ACCEPTANCE</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">D-01</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Legal Review Report</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">PDF</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Day 5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Auto-accepted if no objection in 3 days</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">D-02</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Annotated NDA (Redline)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">DOCX</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Day 5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Auto-accepted if no objection in 3 days</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">D-03</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Risk Assessment Matrix</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">XLSX</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">Day 5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Auto-accepted if no objection in 3 days</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 4 - Pricing */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">4. PRICING</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400 mt-2">
                        <thead className="bg-gray-900 text-white">
                          <tr>
                            <th className="border border-gray-400 px-3 py-2 text-left font-bold">ITEM</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold w-16">QTY</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold w-28">UNIT PRICE</th>
                            <th className="border border-gray-400 px-3 py-2 text-right font-bold w-28">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">NDA Review Service (Standard)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">1</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">—</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">$1,200.00</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Deliverables (D-01, D-02, D-03)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">3</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Included</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">$0.00</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Follow-up Consultation (30 min)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">1</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Included</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">$0.00</td>
                          </tr>
                          <tr className="bg-gray-100">
                            <td colSpan={3} className="border border-gray-400 px-3 py-2 text-right font-medium text-gray-900">Subtotal</td>
                            <td className="border border-gray-400 px-3 py-2 text-right font-medium text-gray-900">USD $1,200.00</td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="border border-gray-400 px-3 py-2 text-right text-gray-900">Sales Tax (if applicable)</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-gray-900">$0.00*</td>
                          </tr>
                          <tr className="bg-blue-700 text-white font-bold">
                            <td colSpan={3} className="border border-gray-400 px-3 py-2 text-right text-sm">TOTAL CONTRACT VALUE</td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-sm">USD $1,200.00</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-[10px] text-gray-600 mt-2 italic">
                        * Tax exemption may apply for legal services. Client responsible for any applicable taxes based on jurisdiction.
                      </p>
                    </div>

                    {/* Optional Add-On Services */}
                    <div className="mt-4">
                      <p className="text-xs font-bold text-gray-900 mb-2">Optional Add-On Services:</p>

                      <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-900 text-white">
                          <tr>
                            <th className="border border-gray-400 px-3 py-2 text-left font-bold">SERVICE</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold w-28">PRICE</th>
                            <th className="border border-gray-400 px-3 py-2 text-center font-bold w-32">UNIT</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Express Delivery (48 hours)</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">$400.00</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Per engagement</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Negotiation Support</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">$350.00</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Per hour</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Additional Version Review</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">$600.00</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Per version</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Extended Consultation</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">$250.00</td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-gray-900">Per hour</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 5 - SLA */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">5. SERVICE LEVEL AGREEMENT</h3>

                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="border border-gray-400 p-2 bg-gray-50">
                          <p className="text-[10px] text-gray-600 uppercase mb-1">RESPONSE TIME</p>
                          <p className="text-xs text-gray-900 mb-1">Initial acknowledgment</p>
                          <p className="text-sm font-bold text-gray-900">&lt; 4 business hours</p>
                        </div>
                        <div className="border border-gray-400 p-2 bg-gray-50">
                          <p className="text-[10px] text-gray-600 uppercase mb-1">DELIVERY</p>
                          <p className="text-xs text-gray-900 mb-1">Standard turnaround</p>
                          <p className="text-sm font-bold text-gray-900">5 business days</p>
                        </div>
                        <div className="border border-gray-400 p-2 bg-gray-50">
                          <p className="text-[10px] text-gray-600 uppercase mb-1">AVAILABILITY</p>
                          <p className="text-xs text-gray-900 mb-1">Business hours coverage</p>
                          <p className="text-sm font-bold text-gray-900">Mon-Fri 9AM-6PM CT</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-2">
                        <div className="border border-gray-400 p-2">
                          <p className="text-[10px] text-gray-600 uppercase mb-1">QUALITY</p>
                          <p className="text-xs text-gray-900 mb-1">Review accuracy target</p>
                          <p className="text-sm font-bold text-gray-900">99%</p>
                        </div>
                        <div className="border border-gray-400 p-2">
                          <p className="text-[10px] text-gray-600 uppercase mb-1">ESCALATION</p>
                          <p className="text-xs text-gray-900 mb-1">Issue resolution</p>
                          <p className="text-sm font-bold text-gray-900">&lt; 24 hours</p>
                        </div>
                        <div className="border border-gray-400 p-2">
                          <p className="text-[10px] text-gray-600 uppercase mb-1">COMMUNICATION</p>
                          <p className="text-xs text-gray-900 mb-1">Status updates</p>
                          <p className="text-sm font-bold text-gray-900">Every 2 days</p>
                        </div>
                      </div>
                    </div>

                    {/* Sección 6 - Security & Compliance */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">6. SECURITY & COMPLIANCE</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400 mt-2">
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium w-40">Data Protection</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">GDPR compliant, CCPA compliant, Data Processing Agreement available</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Security Certifications</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">SOC 2 Type II certified, ISO 27001 aligned</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Encryption</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">AES-256 at rest, TLS 1.3 in transit</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Data Retention</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Documents retained for 7 years per regulatory requirements</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Access Controls</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Role-based access, MFA required, audit logging enabled</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Insurance</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Professional liability: $5M per occurrence / $10M aggregate</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 7 - Assumptions */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">7. ASSUMPTIONS & DEPENDENCIES</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400 mt-2">
                        <tbody>
                          <tr className="bg-blue-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 w-12 text-center font-bold">A1</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Document provided in English, Spanish, French, or German</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 text-center font-bold">A2</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Document length does not exceed 500 words</td>
                          </tr>
                          <tr className="bg-blue-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 text-center font-bold">A3</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Document provided in editable format (Word or high-quality PDF)</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 text-center font-bold">A4</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Client designates single point of contact for queries</td>
                          </tr>
                          <tr className="bg-blue-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 text-center font-bold">A5</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">No expedited timeline unless Express Delivery selected</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900 text-center font-bold">A6</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Client provides complete document within 48 hours of order confirmation</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-[10px] text-gray-600 mt-2 italic">
                        Deviation from assumptions may result in timeline extension and/or pricing adjustment, subject to mutual agreement.
                      </p>
                    </div>

                    {/* Sección 8 - Payment Terms */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">8. PAYMENT TERMS</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400 mt-2">
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium w-40">Payment Terms</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Net 30 from invoice date</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Invoice Timing</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Upon delivery of all deliverables</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Currency</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">USD (United States Dollars)</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Payment Method</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">ACH, Wire Transfer, Credit Card (+3% processing fee)</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Late Payment</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">1.5% per month on overdue amounts</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Purchase Order</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">PO required: ☐ Yes ☐ No   PO#: ____________</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 9 - General Terms */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">9. GENERAL TERMS</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400 mt-2">
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium w-40">Governing Law</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">State of Illinois, USA</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Dispute Resolution</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Binding arbitration per AAA Commercial Rules</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Confidentiality</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Mutual NDA incorporated by reference (Attachment A)</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Limitation of Liability</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Limited to fees paid under this SOF</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Cancellation</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Full refund if cancelled before work begins; 50% if in progress</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Force Majeure</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Standard force majeure provisions apply</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-3 py-2 text-gray-700 font-medium">Assignment</td>
                            <td className="border border-gray-400 px-3 py-2 text-gray-900">Not assignable without prior written consent</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Sección 10 - Contacts */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">10. CONTACTS</h3>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="border border-gray-400 p-3 bg-gray-50">
                          <p className="text-[10px] text-gray-600 uppercase font-bold mb-2">SERVICE PROVIDER CONTACTS</p>
                          <p className="text-xs text-gray-700 mb-1">Engagement Lead:</p>
                          <p className="text-xs font-bold text-gray-900">Sarah Mitchell, Senior Counsel</p>
                          <p className="text-xs text-blue-600">sarah@meridianlegal.com</p>
                          <p className="text-xs text-gray-700 mt-2 mb-1">Billing Contact:</p>
                          <p className="text-xs text-blue-600">billing@meridianlegal.com</p>
                        </div>
                        <div className="border border-gray-400 p-3 bg-gray-50">
                          <p className="text-[10px] text-gray-600 uppercase font-bold mb-2">CLIENT CONTACTS</p>
                          <p className="text-xs text-gray-700 mb-1">Business Owner:</p>
                          <p className="text-xs text-gray-900">Name: ______________________</p>
                          <p className="text-xs text-gray-900">Email: ______________________</p>
                          <p className="text-xs text-gray-700 mt-2 mb-1">Procurement Contact:</p>
                          <p className="text-xs text-gray-900">Name: ______________________</p>
                        </div>
                      </div>
                    </div>

                    {/* Sección 11 - Attachments */}
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-900">11. ATTACHMENTS</h3>

                      <table className="w-full text-xs border-collapse border border-gray-400 mt-2">
                        <thead className="bg-gray-900 text-white">
                          <tr>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold w-24">REF</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">DOCUMENT</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-bold w-48">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Attachment A</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Mutual Non-Disclosure Agreement</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐ Attached ☐ Previously executed</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Attachment B</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Data Processing Agreement (DPA)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐ Attached ☐ Not required</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Attachment C</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Certificate of Insurance</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐ Attached ☐ Available upon request</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Attachment D</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">SOC 2 Type II Report</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐ Attached ☐ Available under NDA</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Attachment E</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-gray-900">Master Services Agreement (if applicable)</td>
                            <td className="border border-gray-400 px-2 py-1.5 text-center text-gray-900">☐ Attached ☐ N/A</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Authorization Box */}
                    <div className="mt-6 border-2 border-blue-600 p-4 bg-blue-50">
                      <h3 className="text-center text-sm font-bold text-blue-900 mb-3">AUTHORIZATION</h3>
                      <p className="text-xs text-center text-gray-900 mb-4">
                        By signing below, both parties agree to the terms and conditions set forth in this Service Order Form.
                      </p>

                      <div className="grid grid-cols-2 gap-6 bg-white p-4 border border-blue-300">
                        <div>
                          <p className="text-xs font-bold text-gray-900 mb-3">SERVICE PROVIDER</p>
                          <p className="text-xs text-gray-700 mb-1">Signature: ______________________</p>
                          <p className="text-xs text-gray-700 mb-1">Name: Sarah Mitchell</p>
                          <p className="text-xs text-gray-700 mb-1">Title: Senior Counsel</p>
                          <p className="text-xs text-gray-700">Date: ______________________</p>
                        </div>
                        <div className="border-l border-gray-300 pl-6">
                          <p className="text-xs font-bold text-gray-900 mb-3">CLIENT (Authorized Signatory)</p>
                          <p className="text-xs text-gray-700 mb-1">Signature: ______________________</p>
                          <p className="text-xs text-gray-700 mb-1">Name: ______________________</p>
                          <p className="text-xs text-gray-700 mb-1">Title: ______________________</p>
                          <p className="text-xs text-gray-700">Date: ______________________</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-400">
                      <p className="text-center text-[10px] text-gray-500 leading-relaxed">
                        Meridian Legal Services, LLC · EIN: 12-3456789 · Illinois Licensed · meridianlegal.com<br />
                        This Service Order Form is subject to the Master Services Agreement (if executed) or Provider&apos;s Standard Terms of Service.
                      </p>
                    </div>
                  </div>
                )}

                {/* Luxury Boutique Example */}
                {previewStyleType === 'luxury-boutique' && (
                  <div className="space-y-8 font-serif text-sm max-w-xl mx-auto py-8">
                    {/* Header ultra minimalista - solo el nombre */}
                    <div className="mb-16">
                      <h1 className="text-lg text-gray-900">Caldwell</h1>
                    </div>

                    {/* Fecha y cliente */}
                    <div className="space-y-2 mb-12">
                      <p className="text-sm text-gray-900">23 January 2026</p>
                      <p className="text-sm text-gray-900">[Client Name]</p>
                    </div>

                    {/* Re: line */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Re:</span> Review of Confidentiality Agreement
                      </p>
                    </div>

                    {/* Primer párrafo */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-900 leading-loose">
                        Thank you for your enquiry. I would be pleased to review the proposed non-disclosure agreement on your behalf.
                      </p>
                    </div>

                    {/* Segundo párrafo - scope */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-900 leading-loose">
                        The engagement would include a full analysis of the document, a written memorandum setting out my observations and recommendations, and an annotated version with proposed amendments. I will be available to discuss the findings with you at your convenience.
                      </p>
                    </div>

                    {/* Párrafo de precio - muy directo */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-900 leading-loose">
                        My fee for this work is $2,400, payable on engagement. I anticipate completing the review within five working days of receiving the document.
                      </p>
                    </div>

                    {/* Opción express */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-900 leading-loose">
                        Should you require an expedited review, I can accommodate a forty-eight hour turnaround for an additional $800.
                      </p>
                    </div>

                    {/* Validez */}
                    <div className="mb-8">
                      <p className="text-sm text-gray-900 leading-loose">
                        This proposal remains open for thirty days. Please let me know if you would like to proceed, or if you have any questions.
                      </p>
                    </div>

                    {/* Cierre simple */}
                    <div className="mb-12">
                      <p className="text-sm text-gray-900 leading-loose">
                        I look forward to hearing from you.
                      </p>
                    </div>

                    {/* Firma ultra minimalista - solo el nombre */}
                    <div className="mt-16">
                      <p className="text-sm text-gray-900">James Caldwell</p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección y Creación de Método de Pago */}
      {
        showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {!selectedPaymentMethodType ? 'Selecciona un Método de Pago' : 'Nuevo Método de Pago'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {!selectedPaymentMethodType ? 'Elige la opción que deseas configurar' : 'Ingresa los detalles correspondientes'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethodType('');
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8 bg-gray-50/50">
                {!selectedPaymentMethodType ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {availablePaymentMethodTypes.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedPaymentMethodType(option.id)}
                        className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-200 group aspect-square"
                      >
                        <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200 filter drop-shadow-sm">
                          {option.icon}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 text-center leading-tight">
                          {option.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-right-4 duration-200">
                    <div className="space-y-6">
                      {(selectedPaymentMethodType === 'bank_transfer' || selectedPaymentMethodType === 'bank_account') && (
                        <>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Beneficiario <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={paymentFormData.beneficiary}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, beneficiary: e.target.value })}
                              className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                              placeholder="Nombre completo o Razón Social"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Banco <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={paymentFormData.bank}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, bank: e.target.value })}
                              className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                              placeholder="Ej. BBVA, Santander"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">CLABE / Número de Cuenta</label>
                            <input
                              type="text"
                              value={paymentFormData.clabe}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, clabe: e.target.value })}
                              className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                              placeholder="18 dígitos (opcional)"
                              maxLength={18}
                            />
                          </div>
                        </>
                      )}
                      {selectedPaymentMethodType === 'card' && (
                        <>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Titular de la Tarjeta <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={paymentFormData.cardHolder}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, cardHolder: e.target.value })}
                              className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                              placeholder="Nombre como aparece en la tarjeta"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Número de Tarjeta <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={paymentFormData.cardNumber}
                              onChange={(e) => setPaymentFormData({ ...paymentFormData, cardNumber: e.target.value })}
                              className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                              placeholder="16 dígitos"
                              maxLength={16}
                            />
                          </div>
                        </>
                      )}
                      {selectedPaymentMethodType === 'paypal' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Correo de PayPal <span className="text-red-500">*</span></label>
                          <input
                            type="email"
                            value={paymentFormData.paypalEmail}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, paypalEmail: e.target.value })}
                            className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                            placeholder="correo@ejemplo.com"
                          />
                        </div>
                      )}
                      {selectedPaymentMethodType === 'stripe' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">ID de Cuenta Stripe <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={paymentFormData.stripeAccount}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, stripeAccount: e.target.value })}
                            className="w-full h-12 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 transition-all outline-none text-sm font-medium text-gray-900"
                            placeholder="acct_..."
                          />
                        </div>
                      )}

                      <div className="flex gap-4 pt-4 mt-4">
                        <button
                          onClick={() => setSelectedPaymentMethodType('')}
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-[#F9FAFB] hover:border-[#9CA3AF] transition-all text-sm font-bold active:scale-95"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={handleSavePaymentMethod}
                          disabled={savingPaymentMethod}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-full hover:from-[#2563EB] hover:to-[#1D4ED8] transition-all text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                          {savingPaymentMethod ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Guardando...
                            </>
                          ) : 'Guardar Método'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
