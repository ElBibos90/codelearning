import { useNavigate } from 'react-router-dom';
import { GraduationCap, Code, Users, BookOpen } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: GraduationCap,
      title: 'Percorsi Formativi',
      description: 'Corsi strutturati per tutti i livelli, dal principiante all\'esperto'
    },
    {
      icon: Code,
      title: 'Esercizi Pratici',
      description: 'Metti alla prova le tue competenze con progetti reali'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Impara e cresci insieme ad altri sviluppatori'
    },
    {
      icon: BookOpen,
      title: 'Risorse Complete',
      description: 'Accesso a documentazione, video e materiali di supporto'
    }
  ];

  return (
    <main className="relative isolate">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <div className="mx-auto max-w-3xl pt-20 pb-32 sm:pt-1 sm:pb-11 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Impara a programmare con CodeLearning
          </h1>
          <p className="mt-6 text-lg leading-8">
            Accedi a corsi di qualità, esercizi pratici e una community di sviluppatori.
            Inizia oggi il tuo percorso nel mondo della programmazione.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={() => navigate('/courses')}
              className="rounded-md bg-blue-800 px-5 py-3 text-lg font-semibold shadow-lg hover:bg-blue-700 transition-all"
            >
              Inizia Ora
            </button>
            <button
              onClick={() => navigate('/about')}
              className="text-lg font-semibold underline hover:text-gray-200"
            >
              Scopri di più <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-1">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-base font-semibold text-blue-600">
            Impara Più Velocemente
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tutto ciò che ti serve per diventare uno sviluppatore
          </p>
          <p className="mt-6 text-lg text-gray-600">
            La nostra piattaforma offre tutti gli strumenti necessari per imparare 
            a programmare in modo efficace e professionale.
          </p>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 mt-16">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center">
                <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate mt-16 px-6 py-16 bg-blue-600 text-white">
        <div className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-3xl">
          <div
            className="ml-[max(50%,38rem)] aspect-[1313/771] w-[82.0625rem] bg-gradient-to-tr from-blue-600 to-blue-400 opacity-50"
            style={{
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
            }}
          />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Pronto a iniziare?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8">
            Iscriviti oggi e inizia il tuo percorso nel mondo della programmazione.
            La nostra community ti aspetta!
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={() => navigate('/register')}
              className="rounded-md bg-white text-blue-600 px-5 py-3 font-semibold shadow-lg hover:bg-gray-100 transition-all"
            >
              Registrati Gratuitamente
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="text-lg font-semibold underline hover:text-gray-200"
            >
              Esplora i Corsi <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
