"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ShopConfigPublic {
  shopName: string;
  shopPhone: string;
  pickupProvince: string;
  pickupDistrict: string;
  pickupWard: string;
  pickupAddress: string;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  footerLogo: string | null;
  businessLicense: string | null;
  licenseDate: string | null;
  taxCode: string | null;
  ownerName: string | null;
}

interface FooterConfigContextType {
  config: ShopConfigPublic | null;
  loading: boolean;
}

const FooterConfigContext = createContext<FooterConfigContextType>({
  config: null,
  loading: true,
});

export function useFooterConfig() {
  return useContext(FooterConfigContext);
}

export function FooterConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ShopConfigPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${API_BASE_URL}/admin/settings/config`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <FooterConfigContext.Provider value={{ config, loading }}>
      {children}
    </FooterConfigContext.Provider>
  );
}
