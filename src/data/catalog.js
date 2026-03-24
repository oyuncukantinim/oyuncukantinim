export const GAMES = [
  {
    id: 1,
    name: 'Valorant',
    subcategories: [{ name: 'Hesap' }, { name: 'Boost' }, { name: 'VP (E-Pin)' }],
  },
  {
    id: 2,
    name: 'League of Legends',
    subcategories: [{ name: 'Hesap' }, { name: 'Koçluk' }, { name: 'RP (E-Pin)' }],
  },
  {
    id: 3,
    name: 'Roblox',
    subcategories: [{ name: 'Pet/İtem' }, { name: 'Hesap' }, { name: 'Robux' }],
  },
  {
    id: 4,
    name: 'Minecraft',
    subcategories: [{ name: 'Premium Hesap' }, { name: 'Sunucu' }, { name: 'İtem/Pelerin' }],
  },
  {
    id: 5,
    name: 'Genshin Impact',
    subcategories: [{ name: 'Hesap' }, { name: 'Boost' }, { name: 'Kristal' }],
  },
];

export const INITIAL_FORM = {
  game_name: GAMES[0].name,
  category: GAMES[0].subcategories[0].name,
  title: '',
  price: '',
  description: '',
  status: 'active',
  imagesText: '',
  cover_index: 0,
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'En yeni' },
  { value: 'price-asc', label: 'Fiyat artan' },
  { value: 'price-desc', label: 'Fiyat azalan' },
];
