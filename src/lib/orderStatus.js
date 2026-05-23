import { AlertTriangle, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';

// Single source of truth for order delivery status — shared by the user side
// (profile orders) and both admin order panels (marketplace + site products).
//
// Previously each of profile.jsx, admin/Orders.jsx and admin/ProductOrders.jsx
// declared its own map. They drifted: the user side only knew statuses 0-3, so
// a cancelled/refunded order (4) rendered as "Teslimat Bekleniyor" to the
// buyer. The admin panels also disagreed on labels ("Anlaşmazlık" vs
// "Sorunlu", "İptal & İade" vs "İptal"). This module makes all three identical.
//
// Each entry ships ready-to-use literal Tailwind classes (badge / activeBtn) so
// consumers don't build dynamic `bg-${tone}-100` strings — those can be purged
// by Tailwind's JIT and silently render without color.

export const DELIVERY_STATUS = {
  0: { label: 'Teslimat Bekleniyor', icon: Clock,         tone: 'orange',  badge: 'bg-orange-100 text-orange-700',   activeBtn: 'bg-orange-100 text-orange-700 border-orange-300' },
  1: { label: 'Teslim Edildi',       icon: Truck,         tone: 'blue',    badge: 'bg-blue-100 text-blue-700',       activeBtn: 'bg-blue-100 text-blue-700 border-blue-300' },
  2: { label: 'Tamamlandı',          icon: CheckCircle,   tone: 'emerald', badge: 'bg-emerald-100 text-emerald-700', activeBtn: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  3: { label: 'Anlaşmazlık',         icon: AlertTriangle, tone: 'red',     badge: 'bg-red-100 text-red-700',         activeBtn: 'bg-red-100 text-red-700 border-red-300' },
  4: { label: 'İptal & İade',        icon: XCircle,       tone: 'slate',   badge: 'bg-slate-100 text-slate-700',     activeBtn: 'bg-slate-100 text-slate-700 border-slate-300' },
};

export function getDeliveryStatus(status) {
  return DELIVERY_STATUS[Number(status)] ?? DELIVERY_STATUS[0];
}

// Order-level status (string) options for admin filters / selectors.
export const ORDER_STATUS_OPTIONS = [
  { value: 'pending',   label: 'İşlemde' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal Edildi' },
  { value: 'refunded',  label: 'İade Edildi' },
];
