import { Sparkles, Settings2, BarChart3 } from "lucide-react"

export default function FeaturesSection() {
  return (
    <section
      id="features"
      aria-label="Características principales"
      className="w-full py-[72px] md:py-[96px] bg-white scroll-mt-20"
    >
      <div className="container px-6 md:px-6 mx-auto overflow-x-hidden">
        <div className="flex flex-col items-center justify-center space-y-10 text-center">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl md:text-[40px] lg:text-[48px] font-extrabold tracking-[-0.02em] leading-[1.15] text-[#0B0F1A]">
              Características Principales
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#7C86A4] leading-[1.7]">
              Descubre cómo Legal AI Quote revoluciona el proceso de cotización legal
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 w-full max-w-6xl mt-10">
            {[
              {
                icon: Sparkles,
                title: "Genera catálogo de servicios con IA",
                description: "Genera nuevos servicios en 1 minuto con nuestra tecnología de IA avanzada",
              },
              {
                icon: Settings2,
                title: "Personaliza y predefine valores",
                description: "Configura tus preferencias y valores predeterminados para cotizaciones más rápidas",
              },
              {
                icon: BarChart3,
                title: "Mercado IA",
                description: "¿No sabes cuánto cobrar? Mercado IA te da consideraciones importantes para tu cobro",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group bg-white border border-[#E9EEF5] rounded-[16px] p-8 transition-all duration-200 hover:border-[#DDE8FD] hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]"
                style={{ boxShadow: '0 1px 2px rgba(16,24,40,0.06)' }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-[#F2F8FF] rounded-[12px] group-hover:bg-[#E8F2FC] transition-colors">
                    <item.icon className="h-8 w-8 text-[#3C65E2]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0B0F1A] leading-[1.3]">{item.title}</h3>
                  <p className="text-[#7C86A4] text-center leading-[1.7]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
