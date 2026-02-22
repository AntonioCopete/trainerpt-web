"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { useAuth } from "@/contexts/auth-context";
// import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, Loader2, Smartphone, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
// import {
//   getDeviceInfo,
//   getDeviceName,
//   isValidDeviceInfo,
// } from "@/utils/deviceFingerprint";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [step, setStep] = useState<
    "email" | "otp" | "device-check" | "register"
  >("email");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [deviceName, setDeviceName] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [showDebugOtp, setShowDebugOtp] = useState(false);

  //   const { login, verifyOtp, checkDevice, verifyDeviceAndLogin, user } =
  //     useAuth();
  const router = useRouter();

  // Ref para leer siempre el user actualizado dentro del polling
  //   const userRef = useRef(user);
  //   useEffect(() => {
  //     userRef.current = user;
  //   }, [user]);

  // Initialize device info on mount
  useEffect(() => {
    // try {
    //   const info = getDeviceInfo();
    //   setDeviceInfo(info);
    //   setDeviceName(getDeviceName());
    // } catch (error) {
    //   console.error("Error getting device info:", error);
    // }
  }, []);

  const redirectByRole = (role?: string) => {
    switch (role) {
      case "admin":
        router.replace("/admin");
        break;
      case "trainer":
        router.replace("/trainer");
        break;
      case "client":
        router.replace("/client");
        break;
      default:
        router.replace("/dashboard"); // fallback
    }
  };

  const waitForUserAndRedirect = async () => {
    // setRedirecting(true);
    // // Hasta ~4s de espera (40 * 100ms)
    // for (let i = 0; i < 40; i++) {
    //   const u = userRef.current;
    //   if (u?.role) {
    //     redirectByRole(u.role);
    //     setRedirecting(false);
    //     return;
    //   }
    //   await new Promise((r) => setTimeout(r, 100));
    // }
    // // Si no llega el user, usar fallback
    // redirectByRole(undefined);
    // setRedirecting(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    // e.preventDefault();
    // setLoading(true);
    // try {
    //   // First, check if this device is remembered
    //   if (deviceInfo && isValidDeviceInfo(deviceInfo)) {
    //     const isKnownDevice = await checkDevice(email, deviceInfo);
    //     if (isKnownDevice) {
    //       setStep("device-check");
    //       setLoading(false);
    //       return;
    //     }
    //   }
    //   // If device not recognized, proceed with normal login flow
    //   const result = await login(email);
    //   // En desarrollo con skipOtp, redirigir directamente
    //   if (result.skipOtp) {
    //     toast({
    //       title: "¡Bienvenido!",
    //       description: "Modo desarrollo: Login automático.",
    //     });
    //     waitForUserAndRedirect();
    //     return;
    //   }
    //   // Capturar OTP si viene en la respuesta (modo desarrollo o servicios caídos)
    //   if (result.otp) {
    //     setDebugOtp(result.otp);
    //     setShowDebugOtp(true);
    //     console.log("🔑 OTP recibido:", result.otp);
    //     // Ir directamente a la pantalla de OTP
    //     setStep("otp");
    //     toast({
    //       title: "Código OTP generado",
    //       description: "Introduce el código mostrado abajo para continuar.",
    //       variant: "default",
    //     });
    //     return;
    //   }
    //   if (result.nextStep === "register") {
    //     setStep("register");
    //   } else {
    //     setStep("otp");
    //     toast({
    //       title: "Código OTP enviado",
    //       description:
    //         "Revisa tu email para obtener el código de verificación.",
    //       variant: "default",
    //     });
    //   }
    // } catch (error: any) {
    //   // Si el error contiene devInfo con OTP (servicio de email caído), extraerlo
    //   const devInfo = error?.devInfo || error?.response?.data?.devInfo;
    //   if (devInfo?.otp) {
    //     setDebugOtp(devInfo.otp);
    //     setShowDebugOtp(true);
    //     console.log("🔑 OTP recibido (error mode):", devInfo.otp);
    //     setStep("otp");
    //     toast({
    //       title: "Código OTP generado",
    //       description: `Email no disponible. Tu código es: ${devInfo.otp}`,
    //       variant: "default",
    //     });
    //   } else {
    //     toast({
    //       title: "Error al enviar código",
    //       description: error.message,
    //       variant: "destructive",
    //     });
    //   }
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otpDigits];
    updatedOtp[index] = value;
    setOtpDigits(updatedOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    // e.preventDefault();
    // setLoading(true);
    // const otp = otpDigits.join("");
    // try {
    //   await verifyOtp(
    //     email,
    //     otp,
    //     rememberDevice && isValidDeviceInfo(deviceInfo),
    //     deviceInfo,
    //   );
    //   toast({
    //     title: "¡Bienvenido de vuelta!",
    //     description: "Has iniciado sesión exitosamente.",
    //     variant: "default",
    //   });
    //   // Iniciar polling para obtener usuario del contexto y redirigir
    //   waitForUserAndRedirect();
    // } catch (error: any) {
    //   toast({
    //     title: "Código incorrecto",
    //     description: error.message,
    //     variant: "destructive",
    //   });
    //   // Limpiar el OTP para intentar de nuevo
    //   setOtpDigits(["", "", "", "", "", ""]);
    //   inputRefs.current[0]?.focus();
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleDeviceLogin = async () => {
    // setLoading(true);
    // try {
    //   await verifyDeviceAndLogin(email, deviceInfo);
    //   toast({
    //     title: "¡Bienvenido!",
    //     description: "Has iniciado sesión desde tu dispositivo reconocido.",
    //     variant: "default",
    //   });
    //   waitForUserAndRedirect();
    // } catch (error: any) {
    //   toast({
    //     title: "Error en el login",
    //     description: error.message || "Por favor, usa tu código OTP.",
    //     variant: "destructive",
    //   });
    //   // Fallback to OTP
    //   const result = await login(email);
    //   if (result.nextStep === "register") {
    //     setStep("register");
    //   } else {
    //     setStep("otp");
    //   }
    // } finally {
    //   setLoading(false);
    // }
  };

  if (step === "register") {
    router.push(`/register?email=${encodeURIComponent(email)}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {redirecting && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-sm bg-black/70 animate-in fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-orange-500 border-r-red-500 animate-spin"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/20 to-red-500/20 blur-xl animate-pulse"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Entrando a tu espacio...
          </h2>
          <p className="text-sm text-gray-400 mb-4 text-center max-w-xs">
            Estamos preparando tu entorno personalizado según tu rol.
          </p>
          <div className="flex gap-2 text-[10px] tracking-widest text-gray-500">
            {["R", "O", "L", "E"].map((c, i) => (
              <span
                key={i}
                className="animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">TrainPT</h1>
          <p className="text-gray-400 mt-2">
            Bienvenido de nuevo a tu viaje fitness
          </p>
        </div>

        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="text-white">
              {step === "email"
                ? "Iniciar sesión"
                : step === "device-check"
                  ? "Dispositivo reconocido"
                  : "Verificar código"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === "email"
                ? "Introduce tu correo para recibir un código de verificación"
                : step === "device-check"
                  ? "Detectamos que ya has usado este dispositivo antes"
                  : "Introduce el código de 6 dígitos que te hemos enviado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-dark pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-red hover-red"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : step === "device-check" ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-full mb-4">
                    <Smartphone className="h-8 w-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Dispositivo reconocido
                  </h3>
                  <p className="text-sm text-gray-400 text-center mb-4">
                    {deviceName || "Tu dispositivo"}
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    Puedes iniciar sesión sin código OTP
                  </p>
                </div>

                <Button
                  onClick={handleDeviceLogin}
                  className="w-full gradient-red hover-red"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Iniciar sesión en este dispositivo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                  onClick={() => {
                    setStep("otp");
                    // toast({
                    //   title: "Código OTP enviado",
                    //   description:
                    //     "Revisa tu email para obtener el código de verificación.",
                    //   variant: "default",
                    // });
                  }}
                >
                  Verificar con código OTP
                </Button>
              </div>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="flex justify-between gap-2">
                  {otpDigits.map((digit, index) => (
                    <Input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      className="w-12 h-14 text-center text-2xl input-dark"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Código enviado a tu número de teléfono
                </p>

                {/* DEBUG MODE - Show OTP automatically */}
                {debugOtp && showDebugOtp && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400 mb-2">
                      Código OTP (Modo desarrollo):
                    </p>
                    <p className="text-2xl font-mono font-bold text-orange-500 tracking-widest">
                      {debugOtp}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Copia este código en los campos de arriba
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="remember-device"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-orange-500 focus:ring-orange-500"
                  />
                  <label
                    htmlFor="remember-device"
                    className="text-sm text-gray-400 cursor-pointer hover:text-gray-300"
                  >
                    Recordar este dispositivo por 30 días
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-red hover-red"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verificar e iniciar sesión"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                  onClick={() => setStep("email")}
                >
                  Volver al correo
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-gray-400">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-red-500 hover:text-red-400">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
