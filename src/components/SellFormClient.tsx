"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { submitSellRequest } from "@/lib/api/sell";
import { useAuth } from "@/lib/auth-context";
import { AddressSelector } from "@/components/user/checkout/AddressSelector";
import { type Address, createAddress } from "@/lib/api/user";

type SellType = "thu-mua" | "ky-gui" | null;

interface ProductFormData {
  images: string[];
  name: string;
  brand: string;
  condition: string;
  description: string;
  price: string;
}

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
}

interface ShopConfig {
  pickupProvince: string;
  pickupDistrict: string;
  pickupWard: string;
  pickupAddress: string;
  shopName: string;
  shopPhone: string;
}

interface SellRequestResponse {
  id: string;
  supershipPickupCode?: string;
  [key: string]: any;
}

const EMPTY_PRODUCT: ProductFormData = {
  images: [],
  name: "",
  brand: "",
  condition: "",
  description: "",
  price: "",
};

const EMPTY_CONTACT: ContactFormData = {
  name: "",
  phone: "",
  email: "",
  city: "",
  address: "",
};

export default function SellFormClient() {
  const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") as SellType | null;

  const [step, setStep] = useState(initialType ? 2 : 1);
  const [sellType, setSellType] = useState<SellType>(initialType);
  const [products, setProducts] = useState<ProductFormData[]>([{ ...EMPTY_PRODUCT }]);
  const [contact, setContact] = useState<ContactFormData>({ ...EMPTY_CONTACT });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState<SellRequestResponse | null>(null);
  const [uploadingProductIdx, setUploadingProductIdx] = useState<number | null>(null);

  // Vietnam areas from backend
  interface VNUnit { code: string; name: string; districts?: VNUnit[]; wards?: VNUnit[]; }
  const [provinces, setProvinces] = useState<VNUnit[]>([]);
  const [districts, setDistricts] = useState<VNUnit[]>([]);
  const [wards, setWards] = useState<VNUnit[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("");
  const [selectedWardCode, setSelectedWardCode] = useState<string>("");
  const [wardName, setWardName] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Categories and brands for searchable dropdowns
  interface Brand { id: string; name: string }
  const [brands, setBrands] = useState<Brand[]>([]);

  // Brand search combobox state
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Helper: upload base64 to Cloudinary via backend (moved inside component to access API_BASE)

  // Fetch provinces from backend
  useEffect(() => {
    setLoadingProvinces(true);
    fetch(`${API_BASE}/areas/provinces`)
      .then(res => res.json())
      .then((data: { results?: VNUnit[]; status?: string }) => {
        setProvinces(data.results || []);
      })
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvinceCode) { setDistricts([]); return; }
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);
    setSelectedDistrictCode("");
    setSelectedWardCode("");
    setWardName("");
    setContact(c => ({ ...c, city: "" }));
    fetch(`${API_BASE}/areas/districts?province=${selectedProvinceCode}`)
      .then(res => res.json())
      .then((data: { results?: VNUnit[] }) => setDistricts(data.results || []))
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [selectedProvinceCode]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrictCode) { setWards([]); return; }
    setLoadingWards(true);
    setWards([]);
    // Do not clear selectedWardCode here if it was set by auto-fill
    // setSelectedWardCode("");
    // setWardName("");
    fetch(`${API_BASE}/areas/communes?district=${selectedDistrictCode}`)
      .then(res => res.json())
      .then((data: { results?: VNUnit[] }) => setWards(data.results || []))
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  }, [selectedDistrictCode]);

  // Handle new address form toggle
  useEffect(() => {
    if (showNewAddressForm) {
      setContact({ ...EMPTY_CONTACT });
      setSelectedProvinceCode("");
      setSelectedDistrictCode("");
      setSelectedWardCode("");
      setWardName("");
    }
  }, [showNewAddressForm]);

  // Auto-fill form when a saved address is selected
  useEffect(() => {
    if (!selectedAddressId || !token) return;

    import("@/lib/api/user").then(({ getAddresses }) => {
      getAddresses(token).then(async (addresses: Address[]) => {
        const addr = addresses.find((a: Address) => a.id === selectedAddressId);
        if (!addr) return;

        setContact(prev => ({
          ...prev,
          name: addr.fullName,
          phone: addr.phone,
          address: addr.address,
          city: addr.city,
        }));
        setWardName(addr.ward || "");
        setSelectedWardCode(addr.postalCode || "");

        if (user?.email) {
          setContact(prev => ({ ...prev, email: user.email }));
        }

        let prov = provinces.find((p: VNUnit) => p.code === addr.city || p.name === addr.city);

        if (!prov && addr.city && addr.district) {
          for (const p of provinces) {
            try {
              const resp = await fetch(`${API_BASE}/areas/districts?province=${encodeURIComponent(p.code)}`);
              const data = await resp.json();
              const found = data.results?.some(
                (d: VNUnit) => d.code === addr.district || d.name === addr.district
              );
              if (found) { prov = p; break; }
            } catch { /* skip */ }
          }
        }

        if (prov) {
          setSelectedProvinceCode(prov.code);
          fetch(`${API_BASE}/areas/districts?province=${encodeURIComponent(prov.code)}`)
            .then((r) => r.json())
            .then((data: any) => {
              if (data.status === "Success" || data.results) {
                setDistricts(data.results || []);
                const dist = data.results?.find(
                  (d: VNUnit) => d.code === addr.district || d.name === addr.district
                );
                if (dist) {
                  setSelectedDistrictCode(dist.code);
                  if (addr.ward) {
                    fetch(`${API_BASE}/areas/communes?district=${encodeURIComponent(dist.code)}`)
                      .then((r2) => r2.json())
                      .then((data2: any) => {
                        if (data2.status === "Success" || data2.results) {
                          setWards(data2.results || []);
                          const ward = data2.results?.find(
                            (w: VNUnit) => w.name === addr.ward
                          );
                          if (ward) {
                            setSelectedWardCode(ward.code);
                            setWardName(ward.name);
                          }
                        }
                      })
                      .catch(() => { });
                  }
                }
              }
            })
            .catch(() => { });
        }
      })
        .catch(() => { });
    });
  }, [selectedAddressId, token, provinces, user?.email]);

  // Fetch categories and brands
  useEffect(() => {
    fetch(`${API_BASE}/brands`)
      .then(r => r.json())
      .then(data => setBrands(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, []);

  const handleProvinceChange = (code: string) => {
    setSelectedProvinceCode(code);
    const prov = provinces.find(p => p.code === code);
    setContact(prev => ({ ...prev, city: prov?.name || "" }));
  };

  const handleDistrictChange = (code: string) => {
    setSelectedDistrictCode(code);
  };

  const handleWardChange = (code: string) => {
    setSelectedWardCode(code);
    const ward = wards.find(w => w.code === code);
    setWardName(ward?.name || "");
  };

  const conditions = [
    "Mới chưa sử dụng",
    "Like new (95-99%)",
    "Excellent (90-94%)",
    "Very good (80-89%)",
    "Good (70-79%)"
  ];

  // Helper: upload base64 to Cloudinary via backend
  const uploadImageToCloudinary = async (base64Data: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/upload/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    const data = await response.json();
    return data.url as string;
  };

  // Helper function to compress image
  const compressImage = (base64Str: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
    });
  };

  const handleImageUpload = (productIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingProductIdx(productIdx);

    Promise.all(
      Array.from(files).map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            if (event.target?.result) {
              const originalBase64 = event.target.result as string;
              const compressedBase64 = await compressImage(originalBase64);
              try {
                const cloudinaryUrl = await uploadImageToCloudinary(compressedBase64);
                setProducts((prev) =>
                  prev.map((p, i) =>
                    i === productIdx
                      ? { ...p, images: [...p.images, cloudinaryUrl] }
                      : p
                  )
                );
              } catch {
                console.error('Upload failed for file:', file.name);
              } finally {
                resolve();
              }
            } else {
              resolve();
            }
          };
          reader.readAsDataURL(file);
        });
      })
    ).finally(() => {
      setUploadingProductIdx(null);
    });
  };

  const removeImage = (productIdx: number, index: number) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === productIdx
          ? { ...p, images: p.images.filter((_, j) => j !== index) }
          : p
      )
    );
  };

  const addProduct = () => {
    setProducts((prev) => [...prev, { ...EMPTY_PRODUCT }]);
  };

  const removeProduct = (productIdx: number) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((_, i) => i !== productIdx));
  };

  const updateProduct = (productIdx: number, field: keyof ProductFormData, value: string | string[]) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === productIdx ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setIsLoading(true);

    try {
      if (showNewAddressForm && saveAddress && token) {
        setSavingAddress(true);
        try {
          const prov = provinces.find(p => p.code === selectedProvinceCode);
          const dist = districts.find(d => d.code === selectedDistrictCode);
          await createAddress(
            {
              fullName: contact.name,
              phone: contact.phone,
              address: contact.address,
              city: prov?.name || contact.city,
              district: dist?.name || "",
              ward: wardName || undefined,
              postalCode: selectedWardCode || undefined,
            },
            token
          );
        } catch (e) {
          console.error("Address save failed:", e);
        } finally {
          setSavingAddress(false);
        }
      }

      const result = await submitSellRequest({
        products: products.map((p) => ({
          name: p.name,
          category: "",
          brand: p.brand,
          condition: p.condition,
          price: p.price,
          description: p.description,
          images: p.images,
        })),
        contactName: contact.name,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        deliveryMethod: "shop-lay",
        pickupProvince: selectedProvinceCode
          ? provinces.find(p => p.code === selectedProvinceCode)?.name
          : undefined,
        pickupCity: contact.city,
        pickupDistrict: selectedDistrictCode
          ? districts.find(d => d.code === selectedDistrictCode)?.name
          : undefined,
        pickupWard: selectedWardCode
          ? wards.find(w => w.code === selectedWardCode)?.name
          : undefined,
        pickupAddress: contact.address,
        saleType: sellType!,
      });
      setSubmitResult(result);
      setIsSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Gửi yêu cầu thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSubmitResult(null);
    setStep(1);
    setSellType(null);
    setProducts([{ ...EMPTY_PRODUCT }]);
    setContact({ ...EMPTY_CONTACT });
    setSelectedProvinceCode("");
    setSelectedDistrictCode("");
    setSelectedWardCode("");
    setWardName("");
    setSaveAddress(false);
    setSavingAddress(false);
  };

  const hasPickupCode = submitResult?.supershipPickupCode;

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const showGoogle = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID";

    const handleGoogleLogin = () => {
      const callbackUrl = `${window.location.origin}/auth/google-callback`;
      const state = encodeURIComponent("/sell/form");
      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
        `&response_type=code` +
        `&scope=email%20profile` +
        `&access_type=offline` +
        `&prompt=select_account` +
        `&state=${state}`;

      window.location.href = googleAuthUrl;
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="max-w-md w-full mx-4 bg-white p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Đăng nhập để tiếp tục</h1>
          <p className="text-zinc-500 mb-8">
            Bạn cần đăng nhập hoặc đăng ký tài khoản để gửi yêu cầu bán đồ.
          </p>
          <div className="space-y-4">
            {showGoogle && (
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 border border-zinc-200 bg-white px-4 py-4 font-medium hover:bg-zinc-50 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Đăng nhập với Google</span>
              </button>
            )}
            <Link href="/auth/login?redirect=/sell/form" className="block w-full bg-black text-white py-4 font-medium hover:bg-zinc-800 transition-colors">
              Đăng nhập
            </Link>
            <Link href="/auth/register?redirect=/sell/form" className="block w-full bg-zinc-100 text-black py-4 font-medium hover:bg-zinc-200 transition-colors">
              Đăng ký tài khoản mới
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <Link href="/sell" className="text-sm text-zinc-500 hover:text-black transition-colors flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Quay lại trang Gửi đồ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="max-w-lg w-full mx-4 bg-white p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          {hasPickupCode ? (
            <>
              <h1 className="text-3xl font-bold mb-4">Đơn hàng & vận đơn đã được tạo!</h1>
              <p className="text-zinc-500 mb-6">
                Mã vận đơn SuperShip của bạn. Vui lòng in hoặc chép mã bên dưới, dán vào bên ngoài gói hàng.
              </p>
              <div className="bg-zinc-100 border-2 border-dashed border-zinc-300 rounded-xl p-6 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Mã vận đơn</p>
                <p className="text-3xl font-mono font-bold text-black tracking-widest">{hasPickupCode}</p>
              </div>
              <a
                href={`https://khachhang.supership.vn/orders/awb?q=${hasPickupCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-black text-white py-4 font-medium hover:bg-zinc-800 transition-colors mb-4"
              >
                In nhãn vận đơn
              </a>
              <p className="text-sm text-zinc-500 mb-4">
                Mang gói hàng đến bưu cục SuperShip gần nhất hoặc gọi <strong>1900 1039</strong> để được lấy tận nơi.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-4">Yêu cầu của bạn đã được gửi!</h1>
              <p className="text-zinc-500 mb-6">
                Cảm ơn bạn đã gửi yêu cầu. Chúng tôi sẽ liên hệ trong vòng 24 giờ để báo giá.
              </p>
            </>
          )}

          <div className="space-y-4">
            <Link href="/account" className="block w-full bg-zinc-100 text-black py-4 font-medium hover:bg-zinc-200 transition-colors">
              Xem trạng thái
            </Link>
            <button
              onClick={resetForm}
              className="text-sm text-zinc-500 hover:text-black transition-colors"
            >
              Gửi thêm sản phẩm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 md:py-6 flex justify-between items-center">
          <Link href="/sell" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Quay lại
          </Link>
          <h1 className="text-xl font-bold">Gửi đồ</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 md:px-8 overflow-x-auto scrollbar-hide">
          <div className="flex items-center py-4 min-w-max">
            {["Chọn loại", "Thông tin sản phẩm", "Liên hệ & Gửi"].map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step >= stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={stepNum} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isActive ? "bg-black text-white" : "bg-zinc-200 text-zinc-400"
                      }`}>
                      {isActive ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : stepNum}
                    </div>
                    <span className={`text-sm font-medium ${isCurrent ? "text-black" : "text-zinc-400 hidden sm:inline"}`}>
                      {label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`w-8 sm:w-24 h-px mx-3 sm:mx-6 ${step > stepNum ? "bg-black" : "bg-zinc-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Step 1: Choose Sell Type */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold mb-2">Bạn muốn bán theo hình thức nào?</h2>
            <p className="text-zinc-500 mb-10">Chọn hình thức phù hợp với bạn</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thu Mua */}
              <button
                onClick={() => setSellType("thu-mua")}
                className={`p-6 md:p-8 border-2 text-left transition-all duration-200 ${sellType === "thu-mua"
                  ? "border-black bg-zinc-100"
                  : "border-zinc-200 hover:border-zinc-400"
                  }`}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Thu mua</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Shop sẽ mua lại sản phẩm với giá thỏa thuận. Thanh toán ngay khi nhận và xác thực.
                </p>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>Thanh toán ngay khi shop nhân hàng</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>Định giá công khai, minh bạch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span><strong>Ưu điểm:</strong> Thanh khoản nhanh, giá bán thấp.</span>
                  </li>
                </ul>
              </button>

              {/* Ky Gui */}
              <button
                onClick={() => setSellType("ky-gui")}
                className={`p-6 md:p-8 border-2 text-left transition-all duration-200 ${sellType === "ky-gui"
                  ? "border-black bg-zinc-100"
                  : "border-zinc-200 hover:border-zinc-400"
                  }`}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Ký gửi</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Để shop đăng bán. Khi bán thành công, bạn nhận tiền sau khi trừ hoa hồng.
                </p>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>Phí ký gửi chỉ từ 12% <a href="/policy/consignment" target="_blank" className="text-blue-600 hover:underline inline-flex items-center ml-1">(chính sách ký gửi <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-0.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>)</a></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>Xử lý trong 3-5 ngày</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span><strong>Ưu điểm:</strong> Giá bán cao, thanh khoản chậm hơn. Không bán được có thể chuyển sang hình thức "Thu Mua"</span>
                  </li>
                </ul>
              </button>
            </div>

            <div className="mt-8 md:mt-10">
              <button
                onClick={() => setStep(2)}
                disabled={!sellType}
                className={`w-full sm:w-auto px-12 py-4 font-medium transition-colors ${sellType
                  ? "bg-black text-white hover:bg-zinc-800"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                  }`}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Product Info */}
        {step === 2 && (
          <div>
            <h2 className="text-3xl font-bold mb-2">Thông tin sản phẩm</h2>
            <p className="text-zinc-500 mb-10">
              {products.length === 1 ? "Cung cấp thông tin chi tiết để chúng tôi định giá tốt nhất" : `${products.length} sản phẩm đã được thêm`}
            </p>

            <div className="space-y-8">
              {products.map((product, idx) => (
                <div key={idx} className="bg-white border border-zinc-200 p-4 sm:p-8 relative mt-4 sm:mt-0">
                  <div className="absolute -top-3 left-4 sm:left-6 bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-widest">
                    Sản phẩm {idx + 1}
                  </div>
                  {products.length > 1 && (
                    <button
                      onClick={() => removeProduct(idx)}
                      className="absolute -top-3 right-4 sm:right-6 bg-red-500 text-white text-xs font-bold px-3 py-1 hover:bg-red-600 transition-colors"
                    >
                      ✕ Xóa
                    </button>
                  )}

                  <div className="space-y-8">
                    {/* Images */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Hình ảnh sản phẩm *</label>
                      <div className="flex flex-wrap gap-4">
                        {product.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative w-24 h-24 bg-white border border-zinc-200">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeImage(idx, imgIdx)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label className="w-24 h-24 border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors bg-white">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 mb-1">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" x2="12" y1="3" y2="15" />
                          </svg>
                          <span className="text-xs text-zinc-400">Thêm ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(idx, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">Tải lên từ 3-5 ảnh chất lượng cao</p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Tên sản phẩm *</label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => updateProduct(idx, "name", e.target.value)}
                        placeholder="VD: Túi xách Hermès Birkin 30"
                        className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors bg-white"
                      />
                    </div>

                    {/* Brand & Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-3">Thương hiệu *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={product.brand}
                            onChange={(e) => {
                              setBrandSearch(e.target.value);
                              setBrandOpen(true);
                              updateProduct(idx, "brand", e.target.value);
                            }}
                            onFocus={() => {
                              setBrandSearch(product.brand);
                              setBrandOpen(true);
                            }}
                            placeholder="Tìm hoặc nhập thương hiệu..."
                            className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors bg-white"
                          />
                          {brandOpen && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 shadow-xl max-h-60 overflow-y-auto">
                              {brands
                                .filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                                .map(b => (
                                  <div
                                    key={b.id}
                                    className={`px-5 py-3 cursor-pointer hover:bg-zinc-50 ${product.brand === b.name ? "bg-zinc-100 font-medium" : ""}`}
                                    onClick={() => {
                                      updateProduct(idx, "brand", b.name);
                                      setBrandOpen(false);
                                      setBrandSearch("");
                                    }}
                                  >
                                    {b.name}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-3">Tình trạng *</label>
                        <select
                          value={product.condition}
                          onChange={(e) => updateProduct(idx, "condition", e.target.value)}
                          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors bg-white"
                        >
                          <option value="">Chọn tình trạng</option>
                          {conditions.map((cond) => (
                            <option key={cond} value={cond}>{cond}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Mô tả</label>
                      <textarea
                        value={product.description}
                        onChange={(e) => updateProduct(idx, "description", e.target.value)}
                        placeholder="Mô tả chi tiết sản phẩm: năm mua, tình trạng, phụ kiện đi kèm..."
                        rows={4}
                        className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors resize-none bg-white"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Giá mong muốn (VND) *</label>
                      <div className="relative max-w-xs">
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProduct(idx, "price", e.target.value)}
                          placeholder="0"
                          className="w-full border border-zinc-300 px-5 py-3 pr-16 focus:border-black focus:outline-none transition-colors bg-white"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400">VND</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addProduct}
                className="w-full py-4 border-2 border-dashed border-zinc-300 text-zinc-500 hover:border-black hover:text-black transition-colors font-medium flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Thêm sản phẩm khác
              </button>
            </div>

            {(() => {
              const allValid = products.every(
                (p) => p.name && p.brand && p.condition && p.price
              );
              return (
                <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-10">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-8 py-4 border border-zinc-300 font-medium hover:border-black transition-colors bg-white order-2 sm:order-1"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!allValid}
                    className={`w-full sm:w-auto px-12 py-4 font-medium transition-colors order-1 sm:order-2 ${allValid
                      ? "bg-black text-white hover:bg-zinc-800"
                      : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      }`}
                  >
                    Tiếp tục
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Step 3: Contact & Shipping */}
        {step === 3 && (
          <div>
            <h2 className="text-3xl font-bold mb-2">Liên hệ & Gửi hàng</h2>
            <p className="text-zinc-500 mb-10">Cung cấp thông diễn để chúng tôi liên hệ và nhận hàng</p>

            <div className="space-y-8">
              {/* Contact Info */}
              <div className="bg-white p-4 sm:p-8 border border-zinc-200">
                <h3 className="font-bold mb-6">Thông tin liên hệ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ... (Hidden on address selector, except if new or editing) */}
                  {(showNewAddressForm || !token || selectedAddressId) && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Họ và tên *</label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => setContact((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="NGUYỄN VĂN A"
                          className="w-full border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium bg-transparent"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email nhận thông báo *</label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="your@email.com"
                          className="w-full border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium bg-transparent"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
                {(showNewAddressForm || !token || selectedAddressId) && (
                  <div className="space-y-2 max-w-md mt-6">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="09xx xxx xxx"
                      className="w-full border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium bg-transparent"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Shipping Method */}
              <div className="bg-white p-4 sm:p-8 border border-zinc-200">
                <h3 className="font-bold mb-6">Phương thức gửi hàng</h3>

                <div className="mb-6 p-4 sm:p-6 bg-zinc-50 border border-zinc-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
                        <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
                        <circle cx="7" cy="18" r="2" />
                        <path d="M15 18H9" />
                        <circle cx="17" cy="18" r="2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Shipper đến lấy tại nhà bạn</h4>
                      <p className="text-sm text-zinc-500 mb-3">
                        Sau khi gửi yêu cầu và được duyệt, bạn bấm <strong>"Tạo vận đơn"</strong> trong trang tài khoản. SuperShip sẽ liên hệ và cử shipper đến địa chỉ bên dưới để lấy hàng.
                      </p>
                    </div>
                  </div>

                  {/* Address Selection Component */}
                  {token && !showNewAddressForm && (
                    <div className="mt-6 mb-6">
                      <AddressSelector
                        token={token}
                        selectedAddressId={selectedAddressId}
                        onSelect={(addr) => {
                          setSelectedAddressId(addr.id);
                          setShowNewAddressForm(false);
                        }}
                        onNewAddress={() => {
                          setShowNewAddressForm(true);
                          setSelectedAddressId(null);
                        }}
                        onDeleted={(deletedId) => {
                          if (selectedAddressId === deletedId) {
                            setSelectedAddressId(null);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Divider and switch back button */}
                  {token && (showNewAddressForm || selectedAddressId) && (
                    <div className="border-t border-zinc-200 pt-6 mt-6">
                      {selectedAddressId && !showNewAddressForm && (
                        <div className="flex justify-end mb-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewAddressForm(true);
                              setSelectedAddressId(null);
                            }}
                            className="text-xs text-zinc-500 hover:text-black underline underline-offset-2 transition-colors font-semibold"
                          >
                            Nhập địa chỉ khác
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Address Fields */}
                  {(showNewAddressForm || !token || selectedAddressId) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tỉnh / Thành phố *</label>
                          <div className="relative">
                            <select
                              value={selectedProvinceCode}
                              onChange={(e) => handleProvinceChange(e.target.value)}
                              className="w-full bg-white border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium appearance-none cursor-pointer"
                              required
                              disabled={loadingProvinces}
                            >
                              <option value="">{loadingProvinces ? "Đang tải..." : "CHỌN TỈNH/THÀNH PHỐ"}</option>
                              {provinces.map(p => (
                                <option key={p.code} value={p.code}>{p.name}</option>
                              ))}
                            </select>
                            {loadingProvinces && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Quận / Huyện *</label>
                          <div className="relative">
                            <select
                              value={selectedDistrictCode}
                              onChange={(e) => handleDistrictChange(e.target.value)}
                              className="w-full bg-white border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium appearance-none cursor-pointer"
                              required
                              disabled={!selectedProvinceCode || loadingDistricts}
                            >
                              <option value="">
                                {loadingDistricts ? "Đang tải..." : !selectedProvinceCode ? "CHỌN TỈNH TRƯỚC" : "CHỌN QUẬN/HUYỆN"}
                              </option>
                              {districts.map(d => (
                                <option key={d.code} value={d.code}>{d.name}</option>
                              ))}
                            </select>
                            {loadingDistricts && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Phường / Xã *</label>
                          <div className="relative">
                            <select
                              value={selectedWardCode}
                              onChange={(e) => handleWardChange(e.target.value)}
                              className="w-full bg-white border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium appearance-none cursor-pointer"
                              required
                              disabled={!selectedDistrictCode || loadingWards}
                            >
                              <option value="">
                                {loadingWards ? "Đang tải..." : !selectedDistrictCode ? "CHỌN QUẬN TRƯỚC" : "CHỌN PHƯỜNG/XÃ"}
                              </option>
                              {wards.map(w => (
                                <option key={w.code} value={w.code}>{w.name}</option>
                              ))}
                            </select>
                            {loadingWards && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-6">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Địa chỉ chi tiết (Số nhà, tên đường) *</label>
                        <input
                          type="text"
                          value={contact.address}
                          onChange={(e) => setContact((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="VD: 123 NGUYỄN HUỆ"
                          className="w-full bg-white border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium"
                          required
                        />
                      </div>

                      {contact.city && selectedDistrictCode && wardName && contact.address && (
                        <div className="p-4 bg-zinc-100 border border-zinc-200 mt-6">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Địa chỉ lấy hàng</p>
                          <p className="text-sm font-medium text-zinc-800">
                            {contact.address}, {wardName}, {districts.find(d => d.code === selectedDistrictCode)?.name}, {contact.city}
                          </p>
                        </div>
                      )}

                      {showNewAddressForm && token && (
                        <div className="space-y-3 mt-6">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={saveAddress}
                              onChange={(e) => setSaveAddress(e.target.checked)}
                              className="w-4 h-4 accent-black cursor-pointer"
                            />
                            <span className="text-xs font-medium text-zinc-600 group-hover:text-black transition-colors">
                              Lưu địa chỉ này cho lần sau
                            </span>
                          </label>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewAddressForm(false);
                                setSelectedAddressId(null);
                              }}
                              className="text-xs text-zinc-500 hover:text-black underline underline-offset-2 transition-colors"
                            >
                              Chọn địa chỉ đã lưu
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Ky Gui Info */}
              {sellType === "ky-gui" && (
                <div className="bg-zinc-100 p-8 border border-zinc-200">
                  <h3 className="font-bold mb-4">Thông tin ký gửi</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <span className="text-sm text-zinc-500 block mb-1">Hoa hồng</span>
                      <span className="text-3xl font-bold">15%</span>
                    </div>
                    <div>
                      <span className="text-sm text-zinc-500 block mb-1">Thời gian xử lý</span>
                      <span className="text-3xl font-bold">3-5 ngày</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-10">
                <button
                  onClick={() => setStep(2)}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-4 border border-zinc-300 font-medium hover:border-black transition-colors bg-white disabled:opacity-50 order-2 sm:order-1"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !contact.name || !contact.email || !contact.phone || !selectedProvinceCode || !selectedDistrictCode || !selectedWardCode || !contact.address}
                  className={`w-full sm:w-auto px-12 py-4 font-medium transition-colors order-1 sm:order-2 ${!isLoading && contact.name && contact.email && contact.phone && selectedProvinceCode && selectedDistrictCode && selectedWardCode && contact.address
                    ? "bg-black text-white hover:bg-zinc-800"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                    }`}
                >
                  {isLoading ? "Đang gửi..." : `Gửi yêu cầu (${products.length} sản phẩm)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
