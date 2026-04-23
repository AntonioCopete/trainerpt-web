"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Star,
  Crown,
  Diamond,
  CheckCircle2,
  Dumbbell,
  Users,
  FileText,
  TrendingUp,
  Globe,
  CreditCard,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  update: () => void;
  draw: () => void;
}

type Bubble = {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
};

function makeBubbles(count = 15): Bubble[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 80 + 30,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 30 + 20,
  }));
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // Bubbles solo en cliente (evita hydration mismatch)
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  const { scrollY } = useScroll();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const y1 = useTransform(scrollY, [0, 300], [0, 50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -30]);

  // Generar bubbles (si no hay reduced motion)
  useEffect(() => {
    if (reduceMotion) {
      setBubbles([]);
      return;
    }
    setBubbles(makeBubbles(15));
  }, [reduceMotion]);

  // Mousemove throttled (si no hay reduced motion)
  useEffect(() => {
    if (reduceMotion) return;

    let raf = 0;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [reduceMotion]);

  // Canvas particles: pausa cuando tab está oculta + respeta reduced motion
  useEffect(() => {
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particlesArray: Particle[] = [];
    const numberOfParticles = 100;
    const colors = ["#10b981", "#059669", "#047857", "#065f46"];

    class ParticleClass implements Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * (canvas.width || 0);
        this.y = Math.random() * (canvas.height || 0);
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;

        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function init() {
      particlesArray.length = 0;
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new ParticleClass());
      }
    }

    init();

    let rafId = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      rafId = requestAnimationFrame(animate);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else {
        if (!running) {
          running = true;
          animate();
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [reduceMotion]);

  const features = [
    {
      id: "routines",
      title: "RUTINAS",
      subtitle: "Crea entrenamientos a medida en minutos",
      description:
        "Diseña entrenamientos visuales, reutiliza tus mejores plantillas y escala tu trabajo sin perder calidad ni tiempo.",
      bulletPoints: [
        "Sistema de plantillas: guarda estructuras base y adáptalas en segundos",
        "Biblioteca de ejercicios integrada para explicar técnica desde el día uno",
        "Adiós a los PDFs: entrenamientos en móvil, siempre interactivos y actualizados",
        "Acabado profesional para cada cliente, incluso cuando escalas",
      ],
      icon: <Dumbbell className="h-8 w-8" />,
      gradient: "from-red-500 to-orange-500",
      image: "/images/gym-equipment.png",
    },
    {
      id: "forms",
      title: "FORMULARIOS",
      subtitle: "Seguimiento automático",
      description:
        "Deja de perseguir a tus clientes. Configura cuestionarios iniciales y revisiones periódicas; la app recoge y ordena la información por ti.",
      bulletPoints: [
        "Formularios de alta a medida para conocer cada caso desde el minuto cero",
        "Check-ins automáticos de peso, sensaciones y progreso",
        "Todo queda guardado en la ficha del cliente: fotos, medidas y respuestas",
        "Menos fricción operativa y más tiempo para entrenar",
      ],
      icon: <FileText className="h-8 w-8" />,
      gradient: "from-blue-500 to-cyan-500",
      image: "/images/form-automation.png",
    },
    {
      id: "clients",
      title: "PROGRESO",
      subtitle: "Evolución visual, decisiones más rápidas",
      description:
        "Visualiza la evolución de peso, medidas y marcas con gráficos claros para demostrar valor y tomar mejores decisiones.",
      bulletPoints: [
        "Gráficos automáticos con los datos de cada check-in",
        "Comparativas reales entre semanas, medidas y fotos",
        "Detecta rápido qué está funcionando y qué hay que ajustar",
        "Aumenta la retención mostrando resultados tangibles",
      ],
      icon: <TrendingUp className="h-8 w-8" />,
      gradient: "from-green-500 to-emerald-500",
      image: "/images/progress.png",
    },

    // {
    //   id: "pagos",
    //   title: "PAGOS",
    //   subtitle: "Cobra sin Perseguir (Próximamente)",
    //   description:
    //     "Automatiza cobros recurrentes, reduce impagos y controla el estado de cada cliente. Ya no tendrás que recordar quién debe qué.",
    //   bulletPoints: [
    //     "Cobros automáticos mes a mes (sin recordatorios)",
    //     "Ve de un vistazo quién ha pagado y quién no",
    //     "Reduce impagos con recordatorios automáticos",
    //     "Integrado con Stripe: seguro y profesional",
    //   ],
    //   icon: <CreditCard className="h-8 w-8" />,
    //   gradient: "from-purple-500 to-pink-500",
    //   image: "/images/payments.png",
    //   comingSoon: true,
    // },
    // {
    //   id: "dietas",
    //   title: "DIETAS",
    //   subtitle: "Planificación Nutricional Simplificada (Próximamente)",
    //   description:
    //     "Crea planes de alimentación personalizados sin complicarte. Ajusta según objetivos, preferencias y evolución de cada cliente.",
    //   bulletPoints: [
    //     "Planes nutricionales adaptados a cada objetivo",
    //     "Biblioteca de alimentos y comidas predefinidas",
    //     "Ajusta macros y calorías con un click",
    //     "Plantillas reutilizables para casos similares",
    //   ],
    //   icon: <Utensils className="h-8 w-8" />,
    //   gradient: "from-orange-500 to-red-500",
    //   image: "/images/nutrition-planning.jpg",
    //   comingSoon: true,
    // },
  ];

  const pricingPlans = [
    {
      icon: <Star className="h-10 w-10" />,
      title: "FREE",
      price: "Gratis",
      description: "Para empezar sin excusas",
      features: [
        "Hasta 2 clientes activos",
        "Formularios ilimitados",
        "Rutinas de ejercicio",
        "Soporte por email",
      ],
      cta: "Empieza gratis",
      highlighted: false,
      gradient: "from-gray-500 to-gray-600",
    },
    {
      icon: <Star className="h-10 w-10" />,
      title: "STARTER",
      price: "9€",
      period: "/ mes",
      description: "Ideal para escalar sin complicaciones",
      features: [
        "Hasta 5 clientes activos",
        "Formularios ilimitados",
        "Rutinas de ejercicio",
        "Soporte prioritario",
      ],
      cta: "Llega al siguiente nivel",
      highlighted: true,
      badge: "Más popular",
      gradient: "from-red-500 to-orange-500",
    },
    {
      icon: <Crown className="h-10 w-10" />,
      title: "PRO",
      price: "19.99€",
      period: "/ mes",
      description: "Para entrenadores que quieren crecer de verdad",
      features: [
        "Hasta 20 clientes activos",
        "Formularios ilimitados",
        "Rutinas de ejercicio",
        "Soporte prioritario",
      ],
      cta: "Listo para escalar",
      highlighted: false,
      gradient: "from-red-500 to-red-600",
    },
    {
      icon: <Diamond className="h-10 w-10" />,
      title: "ELITE",
      price: "49.99€",
      period: "/ mes",
      description: "Para pros con volumen o estudios",
      features: [
        "Clientes ilimitados",
        "Formularios ilimitados",
        "Rutinas de ejercicio",
        "Soporte prioritario",
        // "Análisis avanzados",
        // "Marca personalizada (próximamente)",
      ],
      cta: "Crece sin límites",
      highlighted: false,
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-red-900/20" />

        {/* Floating Bubbles (desactivado si reduce motion) */}
        {!reduceMotion &&
          bubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              className="absolute rounded-full bg-gradient-to-r from-red-500/5 to-orange-500/5"
              style={{
                width: bubble.size,
                height: bubble.size,
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
              }}
              animate={{
                y: [0, -50, 0],
                x: [0, 25, 0],
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: bubble.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Mouse Follower (desactivado si reduce motion) */}
        {!reduceMotion && (
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 blur-3xl pointer-events-none"
            animate={{
              x: mousePosition.x * 3 - 192,
              y: mousePosition.y * 2 - 192,
            }}
            transition={{ type: "spring", damping: 50, stiffness: 100 }}
          />
        )}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center z-10">
        {/* Hero Background Image */}

        <motion.div
          className="relative z-10 text-center max-w-6xl px-4"
          initial={reduceMotion ? false : { opacity: 0, y: 100 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={
            reduceMotion ? undefined : { duration: 1, ease: "easeOut" }
          }
        >
          <motion.div
            className="mb-10 flex justify-center"
            initial={reduceMotion ? false : { opacity: 0, y: -20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              reduceMotion ? undefined : { duration: 0.6, ease: "easeOut" }
            }
          >
            <Image
              src="/images/logo/logo-black-bg-no-bg.png"
              alt="Logo TrainerPT"
              width={320}
              height={120}
              className="h-auto w-52 sm:w-64 md:w-80"
              priority
            />
          </motion.div>

          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 tracking-tighter"
            initial={reduceMotion ? false : { scale: 0.8 }}
            animate={reduceMotion ? undefined : { scale: 1 }}
            transition={
              reduceMotion ? undefined : { duration: 0.8, delay: 0.2 }
            }
          >
            ENTRENA COMO SIEMPRE
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              GESTIONA COMO NUNCA
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl mb-10 text-gray-300 max-w-4xl mx-auto"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={
              reduceMotion ? undefined : { delay: 0.5, duration: 0.8 }
            }
          >
            Deja atrás el caos de PDFs, Excels y WhatsApp. Centraliza rutinas,
            revisiones y clientes en una sola app y ofrece la experiencia
            profesional que tus clientes realmente pagan.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={reduceMotion ? false : { opacity: 0, y: 50 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              reduceMotion ? undefined : { delay: 0.8, duration: 0.6 }
            }
          >
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                className="text-lg px-10 py-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link href="/join">
                  EMPIEZA GRATIS
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-xs sm:text-sm text-gray-400">con 2 clientes</p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={
              reduceMotion ? undefined : { delay: 1.2, duration: 0.8 }
            }
          >
            {[
              { number: "+10h", label: "Ahorradas semanalmente" },
              { number: "+34%", label: "Retención de clientes" },
              { number: "x2.5", label: "Capacidad de atender clientes" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                whileHover={reduceMotion ? undefined : { scale: 1.1 }}
                transition={
                  reduceMotion ? undefined : { type: "spring", stiffness: 300 }
                }
              >
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Parallax Elements (desactivado si reduce motion) */}
        {!reduceMotion && (
          <>
            <motion.div
              className="absolute top-20 left-10 w-20 h-20 bg-red-500/20 rounded-full blur-xl"
              style={{ y: y1 }}
            />
            <motion.div
              className="absolute bottom-20 right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"
              style={{ y: y2 }}
            />
          </>
        )}
      </section>

      {/* Features */}
      <section className="py-20 relative z-10 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 100 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              TU NEGOCIO EN ORDEN.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                SIN CAOS. SIN APPS SUELTAS.
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto">
              Cambia el caos de WhatsApps, notas y hojas de cálculo por una
              experiencia premium. Controla desde la primera rutina hasta cada
              revisión en un mismo lugar.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto justify-items-center">
            {features.map((feature, index) => (
              <motion.button
                key={feature.id}
                onClick={() => setActiveFeature(index)}
                className={`w-full max-w-[220px] p-4 rounded-2xl border-2 transition-all duration-300 ${
                  activeFeature === index
                    ? `bg-gradient-to-r ${feature.gradient} border-transparent text-white`
                    : "bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-300"
                }`}
                whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              >
                <div className="flex flex-col items-center gap-2">
                  {feature.icon}
                  <span className="text-sm font-semibold">{feature.title}</span>
                  {/* {feature.comingSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Pronto
                    </span>
                  )} */}
                </div>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={reduceMotion ? false : { opacity: 0, x: 100 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -100 }}
              transition={reduceMotion ? undefined : { duration: 0.5 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl max-w-6xl mx-auto"
            >
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div
                    className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${features[activeFeature].gradient} mb-6`}
                  >
                    {features[activeFeature].icon}
                  </div>
                  <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    {features[activeFeature].subtitle}
                    {/* {features[activeFeature].comingSoon && (
                      <span className="text-sm px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
                        Próximamente
                      </span>
                    )} */}
                  </h3>
                  <p className="text-gray-300 mb-8 text-lg">
                    {features[activeFeature].description}
                  </p>
                  <ul className="space-y-4">
                    {features[activeFeature].bulletPoints.map(
                      (point, index) => (
                        <motion.li
                          key={index}
                          className="flex items-center gap-4"
                          initial={
                            reduceMotion ? false : { opacity: 0, x: -20 }
                          }
                          animate={
                            reduceMotion ? undefined : { opacity: 1, x: 0 }
                          }
                          transition={
                            reduceMotion ? undefined : { delay: index * 0.1 }
                          }
                        >
                          <div className="text-red-500">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <span className="text-lg">{point}</span>
                        </motion.li>
                      ),
                    )}
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-3xl" />
                  <div className="relative bg-gray-800 rounded-3xl border border-gray-700 p-6 shadow-2xl overflow-hidden">
                    <img
                      src={features[activeFeature].image || "/placeholder.svg"}
                      alt={features[activeFeature].title}
                      className="w-full h-80 object-cover rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 relative z-10 bg-gray-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 100 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              PLANES DE{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                SUSCRIPCIÓN
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Empieza gratis y sube de plan cuando necesites más clientes
              activos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 100 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 0.6, delay: index * 0.1 }
                }
                viewport={{ once: true }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        scale: plan.highlighted ? 1.05 : 1.02,
                        rotateY: 5,
                      }
                }
                className={`relative border rounded-3xl p-8 shadow-2xl transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/50 scale-105"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {"badge" in plan && plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div className="text-center">
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${plan.gradient} mb-6`}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
                  <div className="text-5xl font-bold mb-2">
                    {plan.price}
                    <span className="text-xl text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-gray-400 mb-8">{plan.description}</p>

                  <ul className="space-y-4 text-left mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="text-red-500 mt-1">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.title === "FREE" ? (
                    <Button
                      className="w-full rounded-full py-3 transition-all duration-300 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                      asChild
                    >
                      <Link href="/join">
                        {plan.cta}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">
                      Disponible al activar tu cuenta gratuita
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="py-20 relative z-10 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 100 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              TU HERRAMIENTA{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                PROFESIONAL PARA ENTRENADORES
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto">
              Pensada para el día a día del entrenador: lo esencial para
              preparar trabajo, enviarlo al cliente y mantener el seguimiento
              ordenado.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Gestión Centralizada",
                description:
                  "Toda tu operativa en una sola app: clientes, rutinas y revisiones sin hojas sueltas ni chats interminables.",
                icon: <Users className="h-10 w-10" />,
                gradient: "from-red-500 to-orange-500",
              },
              {
                title: "Seguimiento Automático",
                description:
                  "Programa check-ins y deja que la app recoja peso, fotos y sensaciones por ti, todo ordenado por cliente.",
                icon: <FileText className="h-10 w-10" />,
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                title: "Evolución Visual",
                description:
                  "Demuestra resultados con gráficos y comparativas reales para tomar mejores decisiones y aumentar la retención.",
                icon: <TrendingUp className="h-10 w-10" />,
                gradient: "from-green-500 to-emerald-500",
              },
            ].map((tool, index) => (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 50 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 0.6, delay: index * 0.2 }
                }
                viewport={{ once: true }}
                className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl"
              >
                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${tool.gradient} mb-6`}
                >
                  {tool.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{tool.title}</h3>
                <p className="text-gray-400">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 z-10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-orange-500/20" />
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={reduceMotion ? undefined : { duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10 container mx-auto px-4 text-center"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              ESTÁS A UN CLIC DE PASAR DE ENTRENADOR A{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                REFERENTE
              </span>
            </h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto text-gray-300">
              TrainerPT convierte tu forma de trabajar en una experiencia
              profesional y organizada: rutinas, seguimiento y gestión de
              clientes en un solo lugar.
            </p>
            <Button
              size="lg"
              className="text-lg sm:text-xl px-10 sm:px-16 py-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              asChild
            >
              <Link href="/join">
                EMPIEZA GRATIS
                <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
            </Button>
            <p className="mt-3 text-xs sm:text-sm text-gray-400">
              con 2 clientes
            </p>
          </div>
        </motion.div>
      </section>

      {/* Canvas Background (desactivado si reduce motion) */}
      {!reduceMotion && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full -z-10"
          style={{ opacity: 0.6 }}
        />
      )}
    </div>
  );
}
