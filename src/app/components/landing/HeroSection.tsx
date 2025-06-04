"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import BackgroundPattern from "./backgroundPattern"
import CaseDetailsAnimation from "./CaseDetailsAnimation"
import LogoSection from "./LogoSection"
import { useState } from "react"
import { cn } from "@/lib/utils"
import SignInModal from "@/components/SignInModal"

export default function HeroSection() {
  const [showSignInDialog, setShowSignInDialog] = useState(false)

  return (
    <section className="relative w-full min-h-screen flex items-center pt-2 pb-20 overflow-hidden">
      <BackgroundPattern />
      <div className="container px-4 md:px-6 lg:px-8 xl:pl-[300px] relative z-10">
        <div className="grid gap-8 lg:gap-12 md:grid-cols-[1fr_400px] items-center">
          <div className="flex flex-col justify-center space-y-8">
            <LogoSection />
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                ¿Odias Hacer{" "}
                <span className="inline-block">
                  Cotizaciones?
                  <span className="block text-blue-300">Nosotros También</span>
                </span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-100 max-w-[600px] leading-relaxed">
                Por eso creamos una solución que reduce el tiempo de cotización{" "}
                <span className="line-through text-gray-300">de 30 minutos</span>{" "}
                <span className="text-blue-300 font-bold">a solo 3 minutos</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative group w-full sm:w-auto">
                <div className="absolute -inset-[4px] bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 rounded-xl 
                  opacity-75 blur-[6px] 
                  group-hover:opacity-100 group-hover:blur-[10px] group-hover:scale-[1.02]
                  transition-all duration-500 animate-border-flow"
                ></div>
                
                <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 rounded-xl 
                  opacity-90 blur-[2px] 
                  group-hover:opacity-100 group-hover:blur-[4px] group-hover:scale-[1.01]
                  transition-all duration-500 animate-border-flow-reverse"
                ></div>
                
                <Button
                  className={cn(
                    "relative w-full sm:w-auto",
                    "bg-white text-blue-600",
                    "text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8",
                    "transition-all duration-300",
                    "rounded-xl",
                    "hover:scale-[1.03]",
                    "hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]",
                    "before:absolute before:inset-0",
                    "before:bg-gradient-to-r before:from-white before:to-white/98",
                    "before:rounded-xl before:-z-10",
                    "active:scale-[0.98]",
                    "border border-white/60",
                    "group-hover:text-blue-700",
                    "min-w-[200px]"
                  )}
                  onClick={() => setShowSignInDialog(true)}
                >
                  <span className="relative z-10 flex items-center justify-center font-bold tracking-wide whitespace-nowrap">
                    Empieza Ahora
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center relative z-10 max-w-full">
            <div className="transform hover:scale-[1.02] transition-transform duration-300">
              <CaseDetailsAnimation />
            </div>
          </div>
        </div>
      </div>

      {showSignInDialog && (
        <SignInModal onClose={() => setShowSignInDialog(false)} />
      )}
    </section>
  )
} 