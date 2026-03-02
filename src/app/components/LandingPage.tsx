"use client";

import { Button } from "@/components/ui/button";
import {
  Play,
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
  const [showVideo, setShowVideo] = useState(false);

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
      subtitle: "Creador de Rutinas Inteligente",
      description:
        "Diseña entrenamientos personalizados con nuestro constructor visual drag & drop. IA integrada para análisis automático y recomendaciones.",
      bulletPoints: [
        "Constructor visual con drag & drop revolucionario",
        "Biblioteca con más de 500 ejercicios verificados",
        "Análisis inteligente con IA y métricas avanzadas",
        "Sistema colaborativo único en el mercado",
      ],
      icon: <Dumbbell className="h-8 w-8" />,
      gradient: "from-red-500 to-orange-500",
      image: "/images/gym-equipment.png",
    },
    {
      id: "forms",
      title: "FORMULARIOS",
      subtitle: "Formularios Automatizados",
      description:
        "Olvídate de perseguir a tus clientes. Crea check-ins automáticos y formularios personalizados que se envían solos.",
      bulletPoints: [
        "Check-ins automáticos sin perseguir clientes",
        "Formularios personalizados por tipo de cliente",
        "Automatización completa de seguimiento",
        "Integración total con perfiles de cliente",
      ],
      icon: <FileText className="h-8 w-8" />,
      gradient: "from-blue-500 to-cyan-500",
      image: "/images/form-automation.png",
    },
    {
      id: "tracking",
      title: "PROGRESO",
      subtitle: "Seguimiento Avanzado",
      description:
        "Visualización de progreso en tiempo real con gráficos interactivos, comparativas y análisis predictivo.",
      bulletPoints: [
        "Gráficas automáticas de evolución completa",
        "Comparativas visuales entre períodos",
        "Análisis predictivo con machine learning",
        "Gamificación para aumentar adherencia",
      ],
      icon: <TrendingUp className="h-8 w-8" />,
      gradient: "from-green-500 to-emerald-500",
      image: "/images/progress.png",
    },
    {
      id: "web",
      title: "100% WEB",
      subtitle: "Tecnología Avanzada",
      description: "Todo en un solo lugar. Sin necesidad de instalar apps.",
      bulletPoints: [
        "Todo en un solo lugar",
        "Sin necesidad de instalar apps",
        "Sincronización automática en tiempo real",
        "Tecnología de vanguardia",
      ],
      icon: <Globe className="h-8 w-8" />,
      gradient: "from-indigo-500 to-blue-500",
      image: "/images/100web.png",
    },
    {
      id: "pagos",
      title: "PAGOS",
      subtitle: "Pagos Automatizados",
      description:
        "Olvídate de perseguir a tus clientes. Automatiza cobros y evita impagos con control total.",
      bulletPoints: [
        "Cobros recurrentes automatizados",
        "Recordatorios inteligentes",
        "Control de estado de pagos",
        "Integración con perfiles de cliente",
      ],
      icon: <CreditCard className="h-8 w-8" />,
      gradient: "from-purple-500 to-pink-500",
      image: "/images/payments.png",
    },
    {
      id: "dietas",
      title: "DIETAS",
      subtitle: "Dietas Automatizadas",
      description:
        "Crea planes nutricionales ajustados por objetivo con automatización y control total.",
      bulletPoints: [
        "Planes por objetivo y preferencias",
        "Ajustes rápidos por evolución",
        "Seguimiento con métricas",
        "Automatización de entregas",
      ],
      icon: <Utensils className="h-8 w-8" />,
      gradient: "from-purple-500 to-pink-500",
      image: "/images/nutrition-planning.jpg",
    },
  ];

  const pricingPlans = [
    {
      icon: <Star className="h-10 w-10" />,
      title: "FREE",
      price: "0€",
      period: "/ mes",
      description: "Para empezar sin excusas",
      features: [
        "Hasta 3 clientes activos",
        "Constructor visual básico",
        "Plantillas predefinidas",
        "Soporte básico",
        "Perfil profesional público",
      ],
      cta: "Empieza gratis",
      highlighted: false,
      gradient: "from-gray-500 to-gray-600",
    },
    {
      icon: <Star className="h-10 w-10" />,
      title: "STARTER",
      price: "39€",
      period: "/ mes",
      description: "Ideal para escalar sin complicaciones",
      features: [
        "Hasta 15 clientes activos",
        "Constructor visual completo",
        "Análisis básico con IA",
        "Formularios ilimitados",
        "Estadísticas de negocio",
      ],
      cta: "Llega al siguiente nivel",
      highlighted: false,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: <Crown className="h-10 w-10" />,
      title: "PRO",
      price: "59€",
      period: "/ mes",
      description: "Para entrenadores que quieren crecer de verdad",
      features: [
        "Hasta 40 clientes activos",
        "IA avanzada y análisis predictivo",
        "Sistema colaborativo completo",
        "Marketplace premium",
        "Soporte prioritario 24/7",
      ],
      cta: "Listo para escalar",
      highlighted: true,
      badge: "Más vendido",
      gradient: "from-red-500 to-red-600",
    },
    {
      icon: <Diamond className="h-10 w-10" />,
      title: "ELITE",
      price: "89€",
      period: "/ mes",
      description: "Para pros con volumen o estudios",
      features: [
        "Clientes ilimitados",
        "White-label personalizado",
        "API completa para integraciones",
        "Consultoría estratégica incluida",
        "Funciones experimentales",
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
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 tracking-tighter"
            initial={reduceMotion ? false : { scale: 0.8 }}
            animate={reduceMotion ? undefined : { scale: 1 }}
            transition={
              reduceMotion ? undefined : { duration: 0.8, delay: 0.2 }
            }
          >
            ENTRENA COMO SIEMPRE
            <motion.span
              className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500"
              animate={
                reduceMotion
                  ? undefined
                  : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 3, repeat: Number.POSITIVE_INFINITY }
              }
            >
              GESTIONA COMO NUNCA
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl mb-10 text-gray-300 max-w-4xl mx-auto"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={
              reduceMotion ? undefined : { delay: 0.5, duration: 0.8 }
            }
          >
            La primera plataforma fitness con constructor visual revolucionario
            y sistema colaborativo único. Transforma tu negocio fitness en una
            experiencia premium.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={reduceMotion ? false : { opacity: 0, y: 50 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              reduceMotion ? undefined : { delay: 0.8, duration: 0.6 }
            }
          >
            <Button
              size="lg"
              className="text-lg px-12 py-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              asChild
            >
              <Link href="/join">
                EMPIEZA GRATIS
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            {/* <Button
              size="lg"
              variant="outline"
              className="text-lg px-12 py-6 border-2 border-white/30 text-black rounded-full"
              onClick={() => setShowVideo(true)}
            >
              <Play className="mr-2 h-5 w-5" />
              Ver Demo Interactivo
            </Button> */}
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
              { number: "500+", label: "Entrenadores Elite" },
              { number: "10K+", label: "Clientes Activos" },
              { number: "50K+", label: "Rutinas IA" },
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

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                controls
                autoPlay
                className="w-full h-full object-cover"
                poster="/images/personal-training.jpg"
              >
                <source src="/videos/demo-preview.mp4" type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 text-white hover:text-red-500 text-2xl"
                aria-label="Cerrar"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              La primera plataforma fitness con IA integrada, análisis
              predictivo y constructor visual revolucionario. Todo lo que
              necesitas en una sola herramienta.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.button
                key={feature.id}
                onClick={() => setActiveFeature(index)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
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
                  <h3 className="text-3xl font-bold mb-4">
                    {features[activeFeature].subtitle}
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
                  <div className="flex gap-4 mt-8">
                    <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-full px-8 py-3">
                      Ver Demo Interactivo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
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
              Desde gratis hasta enterprise. Escala tu negocio sin límites.
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

                  <Button
                    className={`w-full rounded-full py-3 transition-all duration-300 ${
                      plan.highlighted
                        ? "bg-white text-red-500 hover:bg-gray-100"
                        : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
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
              Diseñada por y para profesionales del fitness. Todas las
              herramientas que necesitas para destacar en la industria.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Gestión Profesional",
                description:
                  "Organiza clientes, pagos, sesiones y seguimiento desde un único panel de control intuitivo.",
                icon: <Users className="h-10 w-10" />,
                gradient: "from-red-500 to-orange-500",
              },
              {
                title: "Análisis Avanzado",
                description:
                  "Métricas detalladas, KPIs personalizables y reportes automáticos para optimizar tu negocio.",
                icon: <TrendingUp className="h-10 w-10" />,
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                title: "Imagen de Marca",
                description:
                  "Personaliza la experiencia de tus clientes con tu logo, colores y estilo propio.",
                icon: <Crown className="h-10 w-10" />,
                gradient: "from-purple-500 to-pink-500",
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
              profesional y organizada. Rutinas, seguimiento, gestión de
              clientes y todo lo que necesitas en un solo lugar.
            </p>
            <Button
              size="lg"
              className="text-xl px-16 py-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              asChild
            >
              <Link href="/join">
                EMPIEZA GRATIS
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
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
