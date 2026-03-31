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
      game: epin.game_name,
      image: epin.image_emoji || '🎮',
      epin_id: epin.id,
    });
  };

  return (
    <div className="card p-5 flex flex-col h-full relative overflow-hidden group">
      {epin.tag && (
        <span className="absolute top-4 right-4 badge-pink z-10">{epin.tag}</span>
      )}

      <div className="w-full h-28 bg-dark-600 rounded-xl mb-4 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500">
        {epin.image_emoji || '🎮'}
      </div>

      <div className="text-xs font-bold text-neon-purple mb-1">{epin.game_name}</div>
      <h3 className="font-bold text-white mb-4 line-clamp-2 flex-1 leading-tight">{epin.title}</h3>

      <div className="flex items-end justify-between mt-auto">
        <div>
          {epin.old_price && (
            <div className="text-xs text-gray-600 line-through mb-0.5">{Number(epin.old_price).toFixed(2)} ₺</div>
          )}
          <div className="text-xl font-extrabold text-neon-green">{Number(epin.price).toFixed(2)} ₺</div>
        </div>
        <button
          onClick={handleAdd}
          className="bg-neon-purple/10 text-neon-purple p-3 rounded-xl hover:bg-neon-purple hover:text-white transition-all"
          title="Sepete Ekle"
        >
          <ShoppingBag size={20} />
        </button>
      </div>
    </div>
  );
}
