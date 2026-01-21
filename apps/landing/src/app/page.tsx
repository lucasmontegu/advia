export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Gowai
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Tu Asesor de Tormentas con IA
        </p>
        <p className="mt-6 text-lg leading-8 text-gray-500">
          La primera app que no solo te alerta del clima peligroso, sino que te
          dice DONDE refugiarte y te guia hasta ahi.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="https://apps.apple.com/ar/app/gowai/id678901234567890"
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
          >
            Descargar App
          </a>
          <a
            href="#features"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Ver funciones <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </main>
  );
}
