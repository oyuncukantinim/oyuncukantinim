import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function EPinCard({ epin }) {
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart({
      id: epin.id,
      itemType: 'epin',
      title: epin.title,
      price: Number(epin.price),
      image: epin.image_emoji || '🎮',
      epin_id: epin.id,
    });
  };

  return (
    <div className="card relative flex h-full flex-col overflow-hidden p-5 group">
      {epin.tag && (
        <span className="absolute right-4 top-4 z-10 badge-pink">{epin.tag}</span>
      )}

      <div className="mb-4 flex h-28 w-full items-center justify-center rounded-xl bg-surface-100 text-5xl transition-transform duration-500 group-hover:scale-110">
        {epin.image_emoji || '🎮'}
      </div>

      <h3 className="mb-4 flex-1 font-bold leading-tight text-gray-800 line-clamp-2">{epin.title}</h3>

      <div className="mt-auto flex items-end justify-between">
        <div>
          {epin.old_price && (
            <div className="mb-0.5 text-xs text-gray-400 line-through">{Number(epin.old_price).toFixed(2)} ₺</div>
          )}
          <div className="text-xl font-extrabold text-neon-green">{Number(epin.price).toFixed(2)} ₺</div>
        </div>
        <button
          onClick={handleAdd}
          className="rounded-xl bg-neon-purple/10 p-3 text-neon-purple transition-all hover:bg-neon-purple hover:text-white"
          title="Sepete Ekle"
        >
          <ShoppingBag size={20} />
        </button>
      </div>
    </div>
  );
}
