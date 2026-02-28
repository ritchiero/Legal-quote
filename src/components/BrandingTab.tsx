"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/firebase";
import { toast } from "react-hot-toast";
import { onSnapshot } from "firebase/firestore";

import { BrandingData } from "@/app/settings/profile/types"; // Import definition instead of duplicate

// Remove local interface BrandingData definition


interface BrandingTabProps {
  userId: string;
  brandingData: BrandingData;
  onBrandingUpdate: (data: BrandingData) => void;
}

export default function BrandingTab({
  userId,
  brandingData,
  onBrandingUpdate,
}: BrandingTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [formData, setFormData] = useState<BrandingData>(brandingData);

  // Signature Pad State
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  // Google Fonts list (popular choices for legal/professional)
  const googleFonts = [
    "Inter", "Playfair Display", "Merriweather", "Lora", "Roboto",
    "Open Sans", "Montserrat", "Raleway", "Poppins", "Nunito",
    "Source Serif Pro", "Libre Baskerville", "Cormorant Garamond",
    "EB Garamond", "Crimson Text", "PT Serif", "Noto Serif",
    "DM Sans", "Work Sans", "Josefin Sans", "Outfit", "Manrope",
  ];
  const [previewLogoDark, setPreviewLogoDark] = useState<string | null>(null);
  const [previewLogoLight, setPreviewLogoLight] = useState<string | null>(null);

  // Mantén sincronizado el formulario con los datos de branding que reciba el componente
  useEffect(() => {
    setFormData(brandingData);
  }, [brandingData]);

  useEffect(() => {
    const loadBrandingInfo = async () => {
      if (!userId) return;

      try {
        const brandingRef = doc(db, "brandingInfo", userId);
        const unsubscribe = onSnapshot(brandingRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as BrandingData;
            onBrandingUpdate(data);
            setFormData(data);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error al cargar información de branding:", error);
        toast.error("Error al cargar la información de marca");
      }
    };

    loadBrandingInfo();
  }, [userId, onBrandingUpdate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("color")) {
      const colorKey = name
        .replace("color", "")
        .toLowerCase() as keyof typeof formData.colores;
      setFormData((prev) => ({
        ...prev,
        colores: {
          ...prev.colores,
          [colorKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!userId || !e.target.files?.[0]) return;

      const file = e.target.files[0];

      if (!file.type.startsWith("image/")) {
        toast.error("Por favor selecciona un archivo de imagen válido");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe exceder 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);

      const storageRef = ref(storage, `logos/${userId}/${file.name}`);
      await uploadBytes(storageRef, file);

      const logoURL = await getDownloadURL(storageRef);

      setFormData((prev) => ({
        ...prev,
        logoURL,
      }));

      toast.success("Logo subido exitosamente");
    } catch (error) {
      console.error("Error al subir logo:", error);
      toast.error("Error al subir el logo");
    }
  };

  const handleLogoVariantUpload = async (e: React.ChangeEvent<HTMLInputElement>, variant: "dark" | "light") => {
    try {
      if (!userId || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) { toast.error("Selecciona una imagen valida"); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error("Maximo 5MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (variant === "dark") setPreviewLogoDark(reader.result as string);
        else setPreviewLogoLight(reader.result as string);
      };
      reader.readAsDataURL(file);
      const storageRef = ref(storage, `logos/${userId}/logo_${variant}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const field = variant === "dark" ? "logoURLDark" : "logoURLLight";
      setFormData((prev) => ({ ...prev, [field]: url }));
      toast.success(`Logo (${variant === "dark" ? "fondo oscuro" : "fondo claro"}) subido`);
    } catch (error) {
      console.error("Error uploading logo variant:", error);
      toast.error("Error al subir el logo");
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
    if (!userId || !canvasRef.current) return;

    try {
      setSavingSignature(true);
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

      const storageRef = ref(storage, `logos/${userId}/signature_drawn_${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      // Save to Branding Info
      const brandingRef = doc(db, 'brandingInfo', userId);
      await setDoc(brandingRef, { signatureURL: url }, { merge: true });

      // Update local state
      onBrandingUpdate({ ...brandingData, signatureURL: url });
      setFormData(prev => ({ ...prev, signatureURL: url }));

      toast.success("Firma guardada exitosamente");
      setIsSignatureModalOpen(false);
    } catch (error) {
      console.error("Error saving signature", error);
      toast.error("Error al guardar la firma");
    } finally {
      setSavingSignature(false);
    }
  };

  const handleSaveBranding = async () => {
    try {
      setIsLoading(true);

      if (!formData.nombreDespacho.trim()) {
        toast.error("El nombre del despacho es obligatorio");
        return;
      }

      const brandingRef = doc(db, "brandingInfo", userId);

      await setDoc(
        brandingRef,
        {
          ...formData,
          updatedAt: serverTimestamp(),
          userId,
        },
        { merge: true },
      );

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        branding: {
          ...formData,
          updatedAt: serverTimestamp(),
        },
      });

      onBrandingUpdate(formData);
      // Actualiza el estado local para mostrar inmediatamente los cambios guardados
      setFormData(formData);
      setIsModalOpen(false);
      toast.success("Datos de branding guardados exitosamente");
    } catch (error) {
      console.error("Error al guardar datos de branding:", error);
      toast.error("Error al guardar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const hasBrandingData = brandingData.nombreDespacho || brandingData.logoURL;

  return (
    <div className="w-full px-4 md:px-8 max-w-6xl mx-auto">
      {hasBrandingData ? (
        <>
          {/* Header - Sin card contenedora según design system */}
          <div className="px-8 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Identidad de Marca
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Gestiona la imagen y estilo de tu despacho
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Editar
              </button>
            </div>
          </div>

          {/* Contenido con bg-white */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:border-blue-400 transition-all duration-300 hover:shadow-md">
            {/* Información principal del despacho */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Logo */}
              {brandingData.logoURL && (
                <div className="w-24 h-24 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center p-4 flex-shrink-0">
                  <Image
                    src={brandingData.logoURL}
                    alt="Logo"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              )}

              {/* Información del despacho */}
              <div className="flex-grow">
                <h3 className="text-base font-semibold text-gray-900">
                  {brandingData.nombreDespacho}
                </h3>
                {brandingData.slogan && (
                  <p className="mt-1 text-sm italic text-gray-600">
                    &ldquo;{brandingData.slogan}&rdquo;
                  </p>
                )}
                {brandingData.anoFundacion && (
                  <p className="mt-2 text-xs text-gray-500">
                    Fundado en {brandingData.anoFundacion}
                  </p>
                )}
                {brandingData.descripcion && (
                  <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                    {brandingData.descripcion}
                  </p>
                )}
              </div>
            </div>

            {/* Paleta de Colores */}
            <div className="pt-8 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Paleta de Colores
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {["primario", "secundario", "terciario"].map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-12 h-12 rounded-lg shadow-sm border border-gray-200 flex-shrink-0"
                      style={{
                        backgroundColor:
                          brandingData.colores[
                          key as keyof typeof brandingData.colores
                          ],
                      }}
                    />
                    <div>
                      <span className="block text-sm font-medium text-gray-900 capitalize">
                        {key}
                      </span>
                      <span className="block text-xs text-gray-500 uppercase font-mono">
                        {
                          brandingData.colores[
                          key as keyof typeof brandingData.colores
                          ]
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            {/* Logo Variants Display */}
            {(brandingData.logoURLDark || brandingData.logoURLLight) && (
            <div className="pt-8 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Variantes del Logo</h4>
              <div className="grid grid-cols-2 gap-4">
                {brandingData.logoURLDark && (
                <div>
                  <span className="block text-xs text-gray-500 mb-1">Fondo oscuro</span>
                  <div className="w-24 h-24 bg-gray-900 rounded-lg flex items-center justify-center p-2"><Image src={brandingData.logoURLDark} alt="Logo Dark" width={96} height={96} className="w-full h-full object-contain" /></div>
                </div>)}
                {brandingData.logoURLLight && (
                <div>
                  <span className="block text-xs text-gray-500 mb-1">Fondo claro</span>
                  <div className="w-24 h-24 bg-white rounded-lg border flex items-center justify-center p-2"><Image src={brandingData.logoURLLight} alt="Logo Light" width={96} height={96} className="w-full h-full object-contain" /></div>
                </div>)}
              </div>
            </div>)}

            {/* Typography Display */}
            {brandingData.tipografia && (
            <div className="pt-8 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Tipografia</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-gray-500 mb-1">Encabezados</span>
                  <span className="block text-sm font-semibold text-gray-800">{brandingData.tipografia.encabezados}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 mb-1">Cuerpo</span>
                  <span className="block text-sm text-gray-800">{brandingData.tipografia.cuerpo}</span>
                </div>
              </div>
            </div>)}
            {/* Firma Block */}
            <div className="pt-8 border-t border-gray-100 mt-8">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Firma Digital
                </h4>
                <button
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Abrir Pad de Firma
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estilo Email */}
                <div>
                  <span className="text-xs text-gray-500 mb-2 block font-medium">Estilo Email (Texto)</span>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    {brandingData.signatureBlock ? (
                      <div className="prose prose-sm text-gray-600 whitespace-pre-wrap font-sans">
                        {brandingData.signatureBlock}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No has configurado una firma de texto aún.
                      </p>
                    )}
                  </div>
                </div>

                {/* Estilo Manuscrito */}
                <div>
                  <span className="text-xs text-gray-500 mb-2 block font-medium">Firma Manuscrita (Imagen)</span>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center h-[140px]">
                    {brandingData.signatureURL ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={brandingData.signatureURL}
                          alt="Firma Manuscrita"
                          layout="fill"
                          objectFit="contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs text-gray-400 italic mb-2">
                          No has guardado una firma manuscrita.
                        </p>
                        <button
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Dibujar ahora
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-400 transition-all duration-300 hover:shadow-md">
          <div className="px-8 py-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Configura la identidad de tu marca
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
                Define los elementos visuales de tu despacho como el logo,
                colores y más para fortalecer tu presencia profesional
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Comenzar configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Los estilos del modal también se pueden mejorar pero necesitaría más espacio */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {hasBrandingData
                    ? "Editar Identidad de Marca"
                    : "Configurar Identidad de Marca"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Contenido del formulario */}
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo del Despacho
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      {(() => {
                        const logoSrc = previewLogo ?? formData.logoURL ?? "";
                        return logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt="Logo Preview"
                            width={128}
                            height={128}
                            className="w-full h-full object-contain p-2"
                            priority
                          />
                        ) : (
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        );
                      })()}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        Subir logo
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG o GIF (max. 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Despacho
                    </label>
                    <input
                      type="text"
                      name="nombreDespacho"
                      value={formData.nombreDespacho}
                      onChange={handleInputChange}
                      className="w-full h-12 px-5 py-3.5 border border-gray-200 rounded-full focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 outline-none text-sm text-gray-900 transition-all"
                      placeholder="Ej: Bufete Jurídico González & Asociados"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año de Fundación
                    </label>
                    <input
                      type="text"
                      name="anoFundacion"
                      value={formData.anoFundacion}
                      onChange={handleInputChange}
                      className="w-full h-12 px-5 py-3.5 border border-gray-200 rounded-full focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 outline-none text-sm text-gray-900 transition-all"
                      placeholder="Ej: 2010"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slogan
                    </label>
                    <input
                      type="text"
                      name="slogan"
                      value={formData.slogan}
                      onChange={handleInputChange}
                      className="w-full h-12 px-5 py-3.5 border border-gray-200 rounded-full focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 outline-none text-sm text-gray-900 transition-all"
                      placeholder="Ej: Excelencia jurídica a tu servicio"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción breve
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      maxLength={300}
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 hover:border-gray-300 outline-none text-sm text-gray-900 resize-y transition-all"
                      placeholder="Máx. 300 caracteres"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Colores */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Paleta de Colores
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["primario", "secundario", "terciario"].map((key) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          Color {key}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            name={`color${key.charAt(0).toUpperCase() + key.slice(1)}`}
                            value={
                              formData.colores[
                              key as keyof typeof formData.colores
                              ]
                            }
                            onChange={handleInputChange}
                            className="h-9 w-16"
                          />
                          <input
                            type="text"
                            value={formData.colores[
                              key as keyof typeof formData.colores
                            ].toUpperCase()}
                            onChange={handleInputChange}
                            name={`color${key.charAt(0).toUpperCase() + key.slice(1)}`}
                            className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-gray-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


                    {/* Logo Variants for Dark/Light Backgrounds */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Variantes del Logo</h4>
                      <p className="text-xs text-gray-500 mb-3">Sube versiones de tu logo optimizadas para fondos oscuros y claros.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Logo para fondo oscuro</label>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-20 bg-gray-900 rounded-lg border flex items-center justify-center overflow-hidden">
                              {(previewLogoDark || formData.logoURLDark) ? (
                                <Image src={previewLogoDark || formData.logoURLDark || ""} alt="Logo Dark" width={80} height={80} className="w-full h-full object-contain p-1" />
                              ) : (<span className="text-xs text-gray-500">Sin logo</span>)}
                            </div>
                            <div>
                              <input type="file" accept="image/*" onChange={(e) => handleLogoVariantUpload(e, "dark")} className="hidden" id="logo-dark-upload" />
                              <label htmlFor="logo-dark-upload" className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">Subir</label>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Logo para fondo claro</label>
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-20 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
                              {(previewLogoLight || formData.logoURLLight) ? (
                                <Image src={previewLogoLight || formData.logoURLLight || ""} alt="Logo Light" width={80} height={80} className="w-full h-full object-contain p-1" />
                              ) : (<span className="text-xs text-gray-400">Sin logo</span>)}
                            </div>
                            <div>
                              <input type="file" accept="image/*" onChange={(e) => handleLogoVariantUpload(e, "light")} className="hidden" id="logo-light-upload" />
                              <label htmlFor="logo-light-upload" className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">Subir</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Typography - Google Fonts */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Tipografia</h4>
                      <p className="text-xs text-gray-500 mb-3">Selecciona las fuentes de Google Fonts para tus documentos.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Encabezados</label>
                          <select value={formData.tipografia?.encabezados || "Inter"} onChange={(e) => setFormData((prev) => ({ ...prev, tipografia: { encabezados: e.target.value, cuerpo: prev.tipografia?.cuerpo || "Inter" } }))} className="w-full h-12 px-4 border border-gray-200 rounded-full focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-sm text-gray-900">
                            {googleFonts.map((f) => (<option key={f} value={f}>{f}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo de texto</label>
                          <select value={formData.tipografia?.cuerpo || "Inter"} onChange={(e) => setFormData((prev) => ({ ...prev, tipografia: { encabezados: prev.tipografia?.encabezados || "Inter", cuerpo: e.target.value } }))} className="w-full h-12 px-4 border border-gray-200 rounded-full focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-sm text-gray-900">
                            {googleFonts.map((f) => (<option key={f} value={f}>{f}</option>))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-xs text-gray-500 mb-1">Vista previa:</p>
                        <p className="text-lg font-bold text-gray-800" style={{ fontFamily: formData.tipografia?.encabezados || "Inter" }}>Encabezado de ejemplo</p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: formData.tipografia?.cuerpo || "Inter" }}>Este es un texto de ejemplo para el cuerpo del documento.</p>
                      </div>
                    </div>
                {/* Firma Editor */}
                <div className="pt-6 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma Digital (Estilo Email)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Esta firma aparecerá al final de tus correos o en el pie de página de las cotizaciones.
                  </p>
                  <textarea
                    name="signatureBlock"
                    value={formData.signatureBlock || ''}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-sans"
                    placeholder="Atentamente,&#10;Lic. Juan Pérez&#10;Socio Fundador&#10;Bufete Jurídico..."
                  />
                </div>

                {/* Footer con botones */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveBranding}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Signature Pad Modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Dibuja tu firma</h3>
              <button
                onClick={() => setIsSignatureModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 bg-gray-50">
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 shadow-sm overflow-hidden touch-none relative">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={250}
                  className="w-full h-[200px] cursor-crosshair bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div className="absolute top-3 right-3">
                  <button
                    onClick={clearSignature}
                    className="p-1.5 bg-white shadow-sm border border-gray-200 text-gray-500 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
                    title="Borrar firma"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                Dibuja tu firma arriba usando tu mouse o dedo.
              </p>
            </div>

            <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setIsSignatureModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={saveDrawnSignature}
                disabled={savingSignature}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm disabled:opacity-50"
              >
                {savingSignature ? 'Guardando...' : 'Guardar Firma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
