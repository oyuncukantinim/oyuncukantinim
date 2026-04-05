export const DEFAULT_DOPING_OPTIONS = {
  vitrine: [{ days: 7, price: 149, image: '' }],
  featured: [{ days: 7, price: 79, image: '' }],
};

export function normalizeDopingOptions(value, type = 'vitrine') {
  const fallback = DEFAULT_DOPING_OPTIONS[type] || [];
  let raw = value;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = null;
    }
  }

  const items = Array.isArray(raw) ? raw : [];
  const normalized = items
    .map((item) => ({
      days: Math.max(1, Number(item?.days || 0)),
      price: Math.max(0, Number(item?.price || 0)),
      image: typeof item?.image === 'string' ? item.image : '',
    }))
    .filter((item) => Number.isFinite(item.days) && item.days > 0 && Number.isFinite(item.price))
    .sort((a, b) => a.days - b.days)
    .filter((item, index, array) => array.findIndex((other) => other.days === item.days) === index);

  return normalized.length ? normalized : fallback;
}

export function getDopingTypeMeta(type) {
  if (type === 'vitrine') {
    return {
      label: 'Vitrin',
      description: 'Kategoride en üstte yer alır ve ana sayfadaki vitrin alanında gösterilir.',
      badgeClass: 'bg-amber-500/90 text-white',
      accentClass: 'border-amber-200 bg-amber-50',
      buttonClass: 'border-amber-300 bg-amber-50 text-amber-700',
    };
  }

  if (type === 'featured') {
    return {
      label: 'Öne Çıkar',
      description: 'Kategoride vitrinden sonra görünür, ana sayfa vitrininine çıkmaz.',
      badgeClass: 'bg-violet-600/90 text-white',
      accentClass: 'border-violet-200 bg-violet-50',
      buttonClass: 'border-violet-300 bg-violet-50 text-violet-700',
    };
  }

  return {
    label: 'Doping',
    description: '',
    badgeClass: 'bg-slate-900/80 text-white',
    accentClass: 'border-slate-200 bg-slate-50',
    buttonClass: 'border-slate-300 bg-slate-50 text-slate-700',
  };
}

export function findDopingOption(options, days) {
  const normalizedDays = Number(days);
  if (!Array.isArray(options) || !options.length) return null;
  return options.find((option) => Number(option.days) === normalizedDays) || null;
}

export function formatDopingDuration(days) {
  const normalizedDays = Number(days) || 0;
  return `${normalizedDays} gün`;
}

export function getAllDopingOptions(config) {
  return [
    ...(config?.vitrine || []).map((option) => ({ ...option, type: 'vitrine' })),
    ...(config?.featured || []).map((option) => ({ ...option, type: 'featured' })),
  ];
}
