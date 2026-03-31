import { CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Toast() {
  const { toastMessage } = useCart();
  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark-600 border border-neon-purple/30 text-white px-6 py-3 rounded-2xl font-bold shadow-neon-purple flex items-center gap-3 z-[200] animate-[slideUp_0.3s_ease-out]">
      <CheckCircle2 className="text-neon-green" size={20} />
      {toastMessage}
    </div>
  );
}
