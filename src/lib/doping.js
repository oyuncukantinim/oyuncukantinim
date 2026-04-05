export const DEFAULT_DOPING_OPTIONS = {
  vitrine: [{ hours: 24 * 7, days: 7, price: 149, image: '' }],
  featured: [{ hours: 24 * 7, days: 7, price: 79, image: '' }],
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
    .map((item) => {
      const hours = Math.max(1, Number(item?.hours || (Number(item?.days || 0) * 24) || 0));
      return {
        hours,
        days: hours / 24,
        price: Math.max(0, Number(item?.price || 0)),
        image: typeof item?.image === 'string' ? item.image : '',
      };
    })
    .filter((item) => Number.isFinite(item.hours) && item.hours > 0 && Number.isFinite(item.price))
    .sort((a, b) => a.hours - b.hours)
    .filter((item, index, array) => array.findIndex((other) => other.hours === item.hours) === index);

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

export function findDopingOption(options, hours) {
  const normalizedHours = Number(hours);
  if (!Array.isArray(options) || !options.length) return null;
  return options.find((option) => Number(option.hours) === normalizedHours) || null;
}

export function formatDopingDuration(hours) {
  const normalizedHours = Math.max(0, Number(hours) || 0);
  if (normalizedHours <= 0) return '0 saat';
  if (normalizedHours < 24) return `${normalizedHours} saat`;
  if (normalizedHours % 24 === 0) return `${normalizedHours / 24} gün`;
  return `${normalizedHours} saat`;
}

export function getAllDopingOptions(config) {
  return [
    ...(config?.vitrine || []).map((option) => ({ ...option, type: 'vitrine' })),
    ...(config?.featured || []).map((option) => ({ ...option, type: 'featured' })),
  ];
}
