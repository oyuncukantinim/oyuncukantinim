import { useEffect, useState } from 'react';
import { getSiteSettings } from '../lib/api';

const DEFAULT_BRAND = {
  siteName: 'Oyuncu Kantinim',
  siteLogo: '',
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
