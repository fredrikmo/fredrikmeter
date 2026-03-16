import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-white mb-4">
          Fredrikmeter
        </h1>
        <p className="text-white/50 text-lg mb-10">
          Interaktiv avstemning for paneldebatt
        </p>
        <div className="space-y-4">
          <Link
            href="/display"
            className="block w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-2xl hover:bg-blue-700 transition-colors"
          >
            Storskjerm-visning
          </Link>
          <Link
            href="/admin"
            className="block w-full py-4 bg-white/10 text-white/80 text-lg font-medium rounded-2xl hover:bg-white/20 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
