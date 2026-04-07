import { useEffect, useState } from 'react';
import { getSiteSettings } from '../lib/api';
import { normalizeDopingOptions } from '../lib/doping';

const DEFAULT_BRAND = {
  siteName: 'Oyuncu Kantinim',
  siteLogo: '',
  siteLogoText: '',
  siteFavicon: '',
  defaultAvatar: '👤',
  defaultProfileBanner: '',
  defaultListingImage: '',
  registrationEnabled: true,
  balanceAddEnabled: true,
  usernameMinLength: 3,
  usernameMaxLength: 20,
  passwordMinLength: 6,
  maxListingImages: 5,
  listingTitleMax: 100,
  listingDescMax: 2000,
  minListingPrice: null,
  maxListingPrice: null,
  maxListingsPerUser: 50,
  manualDeliveryMaxHours: 72,
  stockItemMaxCount: 500,
  registrationEmailVerificationEnabled: false,
  registrationEmailCodeExpiryMinutes: 10,
  dopingVitrineOptions: normalizeDopingOptions(null, 'vitrine'),
  dopingFeaturedOptions: normalizeDopingOptions(null, 'featured'),
};

// Modül seviyesinde cache — API sadece 1 kez çağrılır
let _cachedBrand = null;
let _fetchPromise = null;

function fetchBrand() {
  if (_cachedBrand) return Promise.resolve(_cachedBrand);
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = getSiteSettings()
    .then((response) => {
      const data = response.data;
      _cachedBrand = {
        siteName: data?.site_name || DEFAULT_BRAND.siteName,
        siteLogo: data?.site_logo || '',
        siteLogoText: data?.site_logo_text || '',
        siteFavicon: data?.site_favicon || '',
        defaultAvatar: data?.default_avatar || DEFAULT_BRAND.defaultAvatar,
        defaultProfileBanner: data?.default_profile_banner || '',
        defaultListingImage: data?.default_listing_image || '',
        registrationEnabled: !(data?.registration_enabled === 0 || data?.registration_enabled === '0' || data?.registration_enabled === false),
        balanceAddEnabled: !(data?.balance_add_enabled === 0 || data?.balance_add_enabled === '0' || data?.balance_add_enabled === false),
        usernameMinLength: Number(data?.username_min_length || DEFAULT_BRAND.usernameMinLength),
        usernameMaxLength: Number(data?.username_max_length || DEFAULT_BRAND.usernameMaxLength),
        passwordMinLength: Number(data?.password_min_length || DEFAULT_BRAND.passwordMinLength),
        maxListingImages: Number(data?.max_listing_images || DEFAULT_BRAND.maxListingImages),
        listingTitleMax: Number(data?.listing_title_max || DEFAULT_BRAND.listingTitleMax),
        listingDescMax: Number(data?.listing_desc_max || DEFAULT_BRAND.listingDescMax),
        minListingPrice: data?.min_listing_price ?? DEFAULT_BRAND.minListingPrice,
        maxListingPrice: data?.max_listing_price ?? DEFAULT_BRAND.maxListingPrice,
        maxListingsPerUser: Number(data?.max_listings_per_user || DEFAULT_BRAND.maxListingsPerUser),
        manualDeliveryMaxHours: Number(data?.manual_delivery_max_hours || DEFAULT_BRAND.manualDeliveryMaxHours),
        stockItemMaxCount: Number(data?.stock_item_max_count || DEFAULT_BRAND.stockItemMaxCount),
        registrationEmailVerificationEnabled: !(data?.registration_email_verification_enabled === 0 || data?.registration_email_verification_enabled === '0' || data?.registration_email_verification_enabled === false),
        registrationEmailCodeExpiryMinutes: Number(data?.registration_email_code_expiry_minutes || DEFAULT_BRAND.registrationEmailCodeExpiryMinutes),
        dopingVitrineOptions: normalizeDopingOptions(data?.listing_doping_vitrine_options, 'vitrine'),
        dopingFeaturedOptions: normalizeDopingOptions(data?.listing_doping_featured_options, 'featured'),
      };
      return _cachedBrand;
    })
    .catch(() => {
      _cachedBrand = DEFAULT_BRAND;
      return _cachedBrand;
    });

  return _fetchPromise;
}

export default function useSiteBrand() {
  const [brand, setBrand] = useState(_cachedBrand || DEFAULT_BRAND);
  const [checked, setChecked] = useState(!!_cachedBrand);

  useEffect(() => {
    if (_cachedBrand) {
      setBrand(_cachedBrand);
      setChecked(true);
      return;
    }

    let active = true;
    fetchBrand().then((b) => {
      if (active) {
        setBrand(b);
        setChecked(true);
      }
    });
    return () => { active = false; };
  }, []);

  return { ...brand, checked };
}
