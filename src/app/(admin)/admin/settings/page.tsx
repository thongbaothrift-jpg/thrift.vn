import { Suspense } from "react";
import { getBankConfig } from "@/lib/api/admin";
import { SettingsPageClient } from "./SettingsPageClient";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG = {
  bankId: "970436",
  bankName: "VIETCOMBANK (VCB)",
  accountNumber: "123456789012",
  accountName: "CONG TY TNHH THRIFT.VN VIETNAM",
  shopName: "THRIFT.VN VIETNAM",
  shopPhone: "",
  pickupProvince: "Thành phố Hồ Chí Minh",
  pickupDistrict: "Quận Tân Bình",
  pickupWard: "Phường 14",
  pickupAddress: "",
  freeShippingThreshold: 999999999,
  defaultShippingFee: 30000,
  allowReturnDays: 7,
  allowReturn: true,
  requireReturnImage: true,
  footerLogo: null,
  businessLicense: null,
  licenseDate: null,
  taxCode: null,
  ownerName: null,
};

async function SettingsLoader() {
  try {
    const bankConfig = await getBankConfig();
    return (
      <SettingsPageClient
        initialBankConfig={{ ...DEFAULT_CONFIG, ...bankConfig }}
      />
    );
  } catch (error) {
    console.error("Failed to load settings:", error);
    return <SettingsPageClient initialBankConfig={DEFAULT_CONFIG} />;
  }
}

export default async function AdminSettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
          Cài đặt hệ thống
        </h1>
        <p className="text-zinc-500 text-sm font-medium">
          Quản lý cấu hình thanh toán, địa chỉ lấy hàng và vận chuyển.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="max-w-4xl space-y-8 animate-pulse">
            <div className="h-96 bg-white border border-zinc-100 rounded-3xl" />
            <div className="h-64 bg-white border border-zinc-100 rounded-3xl" />
          </div>
        }
      >
        <SettingsLoader />
      </Suspense>
    </div>
  );
}
