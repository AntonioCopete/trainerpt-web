export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-gray-900 border-t border-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-300">CONTACTO</h3>
            <div className="space-y-2 text-gray-400">
              <p>
                <span className="text-red-500 font-medium">Email:</span>{" "}
                info@trainpt.com
              </p>
              <p>
                <span className="text-red-500 font-medium">Teléfono:</span> +34
                91 123 45 67
              </p>
              <p>
                <span className="text-red-500 font-medium">Horario:</span> 24/7
                Soporte IA
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-300">
              PLATAFORMA
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>Constructor Visual</li>
              <li>IA Integrada</li>
              <li>Sistema Colaborativo</li>
              <li>Análisis Predictivo</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-300">
              EMPRESA
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>Sobre Nosotros</li>
              <li>Carreras</li>
              <li>Prensa</li>
              <li>Inversores</li>
            </ul>
          </div>
          <div>
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 rounded-2xl text-center">
              <div className="text-white text-4xl font-bold mb-2">
                TRAINERPT
              </div>
              <p className="text-white/90">El futuro del fitness</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
          <p>© {year} TrainerPT. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
