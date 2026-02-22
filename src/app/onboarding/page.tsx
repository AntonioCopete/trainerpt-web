"use client";

import React, { useEffect } from "react";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, User, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { createSupabaseBrowser } from "../lib/supabase/browser";

type AccountType = "trainer" | "client" | null;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [formData, setFormData] = useState({
    fullName: "",
  });
  const supabase = createSupabaseBrowser();

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinue = async () => {
    if (step === 1 && accountType) {
      setStep(2);
    } else if (step === 2 && formData.fullName && accountType) {
      // Here you would typically submit the data
      const userData = {
        name: formData.fullName,
        role: accountType,
      };

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(userData),
        },
      );

      console.log("Onboarding response:", response);
    }
  };

  const isStep1Valid = accountType !== null;
  const isStep2Valid = formData.fullName.trim() !== "";

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-red-900/20" />

        {/* Floating gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                TrainerPT
              </span>{" "}
              Pro
            </h1>
            <p className="text-gray-400 mt-2">
              Configura tu cuenta para empezar
            </p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-10"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  step >= 1
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {step > 1 ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= 1 ? "text-white" : "text-gray-500"
                }`}
              >
                Tipo de cuenta
              </span>
            </div>
            <div className="w-12 h-0.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                initial={{ width: "0%" }}
                animate={{ width: step >= 2 ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  step >= 2
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${
                  step >= 2 ? "text-white" : "text-gray-500"
                }`}
              >
                Datos personales
              </span>
            </div>
          </motion.div>

          {/* Card Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-center mb-2">
                    ¿Cómo quieres usar TrainerPT?
                  </h2>
                  <p className="text-gray-400 text-center mb-8">
                    Selecciona el tipo de cuenta que mejor se adapte a ti
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Trainer Card */}
                    <motion.button
                      onClick={() => handleAccountTypeSelect("trainer")}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                        accountType === "trainer"
                          ? "border-red-500 bg-gradient-to-br from-red-500/10 to-orange-500/10"
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {accountType === "trainer" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                          accountType === "trainer"
                            ? "bg-gradient-to-r from-red-500 to-orange-500"
                            : "bg-gray-700 group-hover:bg-gray-600"
                        }`}
                      >
                        <Dumbbell className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Entrenador</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Gestiona clientes, crea rutinas personalizadas, diseña
                        planes de nutrición y haz crecer tu negocio fitness.
                      </p>
                      <ul className="mt-4 space-y-2">
                        {[
                          "Gestión de clientes",
                          "Creador de rutinas con IA",
                          "Planes de nutrición",
                          "Perfil profesional público",
                        ].map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-300"
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                accountType === "trainer"
                                  ? "bg-orange-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </motion.button>

                    {/* Client Card */}
                    <motion.button
                      onClick={() => handleAccountTypeSelect("client")}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                        accountType === "client"
                          ? "border-red-500 bg-gradient-to-br from-red-500/10 to-orange-500/10"
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {accountType === "client" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                          accountType === "client"
                            ? "bg-gradient-to-r from-red-500 to-orange-500"
                            : "bg-gray-700 group-hover:bg-gray-600"
                        }`}
                      >
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Cliente</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Accede a tus rutinas, planes de nutrición y sigue tu
                        progreso con tu entrenador personal.
                      </p>
                      <ul className="mt-4 space-y-2">
                        {[
                          "Ver rutinas asignadas",
                          "Seguimiento de progreso",
                          "Comunicación directa",
                          "Historial de entrenamientos",
                        ].map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-300"
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                accountType === "client"
                                  ? "bg-orange-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-center mb-2">
                    Cuéntanos sobre ti
                  </h2>
                  <p className="text-gray-400 text-center mb-8">
                    Completa tu perfil para personalizar tu experiencia
                  </p>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-300">
                        Nombre completo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Tu nombre completo"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 h-12 rounded-xl"
                      />
                    </div>

                    {/* Account Type Summary - Clickable to go back */}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                            {accountType === "trainer" ? (
                              <Dumbbell className="w-5 h-5 text-white" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">
                              Tipo de cuenta
                            </p>
                            <p className="font-semibold text-white">
                              {accountType === "trainer"
                                ? "Entrenador"
                                : "Cliente"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400 hover:text-white transition-colors">
                          Cambiar
                        </span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Button
                onClick={handleContinue}
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {step === 1 ? "Continuar" : "Completar registro"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Footer text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-gray-500 text-sm mt-6"
          >
            Al continuar, aceptas nuestros{" "}
            <a href="/terms" className="text-red-400 hover:underline">
              Términos de servicio
            </a>{" "}
            y{" "}
            <a href="/privacy" className="text-red-400 hover:underline">
              Política de privacidad
            </a>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
