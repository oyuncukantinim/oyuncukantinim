import { useEffect, useState } from 'react';
import { getSiteSettings } from '../lib/api';

const DEFAULT_BRAND = {
  siteName: 'Oyuncu Kantinim',
  siteLogo: '',
  siteLogoText: '',
  siteFavicon: '',
  defaultAvatar: 'ğŸ‘¤',
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
};

export default function useSiteBrand() {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    getSiteSettings()
      .then((response) => {
        if (!active) return;
        setBrand({
          siteName: response.data?.site_name || DEFAULT_BRAND.siteName,
          siteLogo: response.data?.site_logo || '',
          siteLogoText: response.data?.site_logo_text || '',
          siteFavicon: response.data?.site_favicon || '',
          defaultAvatar: response.data?.default_avatar || DEFAULT_BRAND.defaultAvatar,
          defaultProfileBanner: response.data?.default_profile_banner || '',
          defaultListingImage: response.data?.default_listing_image || '',
          registrationEnabled: !(response.data?.registration_enabled === 0 || response.data?.registration_enabled === '0' || response.data?.registration_enabled === false),
          balanceAddEnabled: !(response.data?.balance_add_enabled === 0 || response.data?.balance_add_enabled === '0' || response.data?.balance_add_enabled === false),
          usernameMinLength: Number(response.data?.username_min_length || DEFAULT_BRAND.usernameMinLength),
          usernameMaxLength: Number(response.data?.username_max_length || DEFAULT_BRAND.usernameMaxLength),
          passwordMinLength: Number(response.data?.password_min_length || DEFAULT_BRAND.passwordMinLength),
          maxListingImages: Number(response.data?.max_listing_images || DEFAULT_BRAND.maxListingImages),
          listingTitleMax: Number(response.data?.listing_title_max || DEFAULT_BRAND.listingTitleMax),
          listingDescMax: Number(response.data?.listing_desc_max || DEFAULT_BRAND.listingDescMax),
          minListingPrice: response.data?.min_listing_price ?? DEFAULT_BRAND.minListingPrice,
          maxListingPrice: response.data?.max_listing_price ?? DEFAULT_BRAND.maxListingPrice,
          maxListingsPerUser: Number(response.data?.max_listings_per_user || DEFAULT_BRAND.maxListingsPerUser),
          manualDeliveryMaxHours: Number(response.data?.manual_delivery_max_hours || DEFAULT_BRAND.manualDeliveryMaxHours),
          stockItemMaxCount: Number(response.data?.stock_item_max_count || DEFAULT_BRAND.stockItemMaxCount),
          registrationEmailVerificationEnabled: !(response.data?.registration_email_verification_enabled === 0 || response.data?.registration_email_verification_enabled === '0' || response.data?.registration_email_verification_enabled === false),
        });
      })
      .catch(() => {
        if (!active) return;
        setBrand(DEFAULT_BRAND);
      })
      .finally(() => {
        if (active) setChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return { ...brand, checked };
}

