import { Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-16 py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Gamepad2 size={22} />
            <span className="font-extrabold text-lg">Oyuncu Kantinim</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <Link to="/store" className="hover:text-neon-purple transition-colors">E-Pin</Link>
            <Link to="/market" className="hover:text-neon-purple transition-colors">Pazar</Link>
            <span className="cursor-default">SSS</span>
            <span className="cursor-default">Destek</span>
          </div>
          <div className="text-gray-400 text-sm">
            &copy; 2026 Oyuncu Kantinim
          </div>
        </div>
      </div>
    </footer>
  );
}
