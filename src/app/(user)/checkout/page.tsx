"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { convertDriveLink } from "@/lib/utils";
import { formatPrice } from "@/lib/api";
import { createOrder, checkFirstOrder } from "@/lib/api/orders";
import { createVNPayUrl } from "@/lib/api/reviews-notifications";
import { useSiteTexts } from "@/lib/site-texts-context";
import { AddressSelector } from "@/components/user/checkout/AddressSelector";
import { createAddress, type Address } from "@/lib/api/user";

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  wardName?: string;
  note: string;
  shippingFee: number;
}

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, appliedCoupon } = useCart();
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const { get } = useSiteTexts();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isFirstOrder, setIsFirstOrder] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [orderDoneId, setOrderDoneId] = useState("");

  // Free shipping: đơn từ ngưỡng trong admin HOẶC tối thiểu 2 sản phẩm
  const getShippingFee = (
    subtotal: number,
    totalItems: number,
    fixedFee: number,
    threshold: number,
  ) => {
    if (subtotal >= threshold || totalItems >= 2) return 0;
    return fixedFee;
  };

  // Shop config từ admin settings
  const [shopConfig, setShopConfig] = useState<{
    shippingFee: number;
    freeShippingThreshold: number;
  } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/shop`)
      .then((r) => r.json())
      .then((data) => {
        if (data.shippingFee !== undefined) {
          setShopConfig({
            shippingFee: data.shippingFee,
            freeShippingThreshold: data.freeShippingThreshold ?? Infinity,
          });
        }
      })
      .catch(() => {});
  }, []);

  const DEFAULT_SHIPPING_FEE = shopConfig?.shippingFee ?? 30000;
  const FREE_SHIPPING_THRESHOLD = shopConfig?.freeShippingThreshold ?? Infinity;
  const shippingFee = getShippingFee(
    totalPrice,
    totalItems,
    DEFAULT_SHIPPING_FEE,
    FREE_SHIPPING_THRESHOLD,
  );

  useEffect(() => {
    if (isAuthenticated) {
      checkFirstOrder()
        .then((res) => setIsFirstOrder(res.isFirstOrder))
        .catch(() => setIsFirstOrder(true));
    } else {
      setIsFirstOrder(true);
    }
  }, [isAuthenticated]);

  // Redirect unauthenticated users away from checkout (only for COD — handled in PaymentForm)
  // This is intentionally removed: guest CAN access checkout for VNPay/Bank

  if (authLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-20 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (orderDone) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-16 text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">
          Cảm ơn bạn!
        </h2>
        <p className="text-zinc-500 mb-2">
          Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
        </p>
        <p className="text-sm font-bold text-zinc-900 mb-8">
          Mã đơn hàng:{" "}
          <span className="text-brand-red">
            {orderDoneId ? `ORD-${orderDoneId.slice(0, 8).toUpperCase()}` : ""}
          </span>
        </p>
        <div className="max-w-md mx-auto bg-zinc-50 p-6 border border-zinc-100 mb-10 text-left space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            {get(
              "order.confirmation_email_text",
              "Một email xác nhận đã được gửi đến địa chỉ email của bạn.",
            )}
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {get(
              "order.confirmation_message",
              `Nhân viên ${get("brand.shop_name") || "Thrift.vn"} sẽ gọi điện xác nhận trong 24h tới.`,
            )}
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {get(
              "order.tracking_notice",
              "Bạn có thể theo dõi tình trạng đơn hàng trong phần Tài khoản.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/account/orders" className="btn-primary px-10">
            Xem đơn hàng
          </Link>
          <Link href="/shop" className="btn-ghost px-10">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-20 text-center">
        <h1 className="text-3xl font-bold uppercase tracking-tight mb-4">
          Giỏ hàng trống
        </h1>
        <p className="text-zinc-500 mb-8">
          Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán.
        </p>
        <Link href="/shop" className="btn-primary inline-block">
          Bắt đầu mua sắm
        </Link>
      </div>
    );
  }

  const discount = appliedCoupon
    ? appliedCoupon.discountPercent
      ? (totalPrice * appliedCoupon.discountPercent) / 100
      : appliedCoupon.discountAmount || 0
    : 0;

  const tax = 0;
  const grandTotal = Math.max(0, totalPrice - discount + shippingFee + tax);

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12">
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <Link
            href="/cart"
            className="hover:text-black transition-colors uppercase tracking-widest text-[10px] font-bold"
          >
            {get("ui.gio_hang", "Giỏ hàng")}
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-black font-bold uppercase tracking-widest text-[10px]">
            Thanh toán
          </span>
        </ol>
      </nav>

      {/* Guest login banner */}
      {!token && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Bạn chưa đăng nhập
            </p>
            <p className="text-xs text-blue-600">
              Đăng nhập hoặc đăng ký để lưu thông tin và nhận các ưu đãi.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/auth/login?redirect=/checkout"
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register?redirect=/checkout"
              className="px-4 py-2 border border-blue-300 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-16">
        <div className="flex items-center gap-0">
          {[
            { n: 1, label: "Thông tin" },
            { n: 2, label: "Thanh toán" },
            { n: 3, label: "Xác nhận" },
          ].map(({ n, label }, idx) => (
            <div key={n} className="flex items-center">
              <div className="flex flex-col items-center relative">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    step >= n
                      ? "bg-black border-black text-white"
                      : "bg-white border-zinc-200 text-zinc-300"
                  }`}
                >
                  {step > n ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    n
                  )}
                </div>
                <span
                  className={`absolute -bottom-7 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${step >= n ? "text-black" : "text-zinc-300"}`}
                >
                  {label}
                </span>
              </div>
              {idx < 2 && (
                <div
                  className={`w-16 sm:w-24 h-[2px] transition-colors duration-500 mx-2 ${step > n ? "bg-black" : "bg-zinc-100"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-12">
        <div className="lg:col-span-7 xl:col-span-8">
          {step === 1 && (
            <ShippingForm
              onNext={(info: ShippingInfo) => {
                setShippingInfo(info);
                setStep(2);
              }}
              shopConfig={shopConfig}
              token={token}
              selectedAddressId={selectedAddressId}
              onSelectAddress={(addr) => {
                setSelectedAddressId(addr.id);
                setShowNewAddressForm(false);
              }}
              showNewAddressForm={showNewAddressForm}
              onToggleNewAddress={() => {
                setShowNewAddressForm((prev) => !prev);
                setSelectedAddressId(null);
              }}
              onAddressDeleted={() => setSelectedAddressId(null)}
            />
          )}
          {step === 2 && (
            <PaymentForm
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              isFirstOrder={isFirstOrder}
              grandTotal={grandTotal}
              isAuthenticated={isAuthenticated}
            />
          )}
          {step === 3 && (
            <OrderSummaryStep
              shippingInfo={shippingInfo!}
              paymentMethod={paymentMethod}
              onBack={() => setStep(2)}
              grandTotal={grandTotal}
              onOrderDone={(id) => {
                setOrderDone(true);
                setOrderDoneId(id);
              }}
            />
          )}
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-zinc-50 p-8 sticky top-28 border border-zinc-100">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-10 text-zinc-900 pb-4 border-b border-zinc-200">
              Đơn hàng của bạn
            </h2>

            <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {items.map(({ product, quantity, size }) => (
                <div key={`${product.id}-${size}`} className="flex gap-4">
                  <div className="relative w-20 h-28 bg-white border border-zinc-200 flex-shrink-0 overflow-hidden">
                    <Image
                      src={
                        convertDriveLink(product.images?.[0]) ||
                        "/placeholder-product.jpg"
                      }
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      {product.brand?.name}
                    </p>
                    <p className="text-sm font-bold text-zinc-900 leading-tight mb-1 truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>
                        SL:{" "}
                        <span className="text-black font-semibold">
                          {quantity}
                        </span>
                      </span>
                      {size && (
                        <span>
                          Size:{" "}
                          <span className="text-black font-semibold uppercase">
                            {size}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black text-black mt-2">
                      {formatPrice(product.price * quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-200">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Tạm tính ({totalItems})</span>
                <span className="font-bold">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Vận chuyển</span>
                <span
                  className={
                    shippingFee === 0
                      ? "font-bold text-green-600 uppercase tracking-wide text-xs"
                      : "font-bold"
                  }
                >
                  {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Giảm giá{" "}
                    {appliedCoupon?.code ? `(${appliedCoupon.code})` : ""}
                  </span>
                  <span className="font-bold text-brand-red">
                    -{formatPrice(discount)}
                  </span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Thuế</span>
                  <span className="font-bold">{formatPrice(tax)}</span>
                </div>
              )}
              <div className="flex justify-between pt-6 mt-4 border-t-2 border-black">
                <span className="font-bold uppercase tracking-wider text-sm">
                  Tổng cộng
                </span>
                <span className="font-black text-2xl text-brand-red">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white border border-zinc-100 rounded-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Đã xác thực chính hãng
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white border border-zinc-100 rounded-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Bảo mật thanh toán 100%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Step 1: Shipping Information
// ============================================
function ShippingForm({
  onNext,
  shopConfig,
  token,
  selectedAddressId,
  onSelectAddress,
  showNewAddressForm,
  onToggleNewAddress,
  onAddressDeleted,
}: {
  onNext: (info: ShippingInfo) => void;
  shopConfig: { shippingFee: number; freeShippingThreshold: number } | null;
  token: string | null;
  selectedAddressId: string | null;
  onSelectAddress: (addr: Address) => void;
  showNewAddressForm: boolean;
  onToggleNewAddress: () => void;
  onAddressDeleted: () => void;
}) {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const DEFAULT_SHIPPING_FEE = shopConfig?.shippingFee ?? 30000;
  const FREE_SHIPPING_THRESHOLD = shopConfig?.freeShippingThreshold ?? Infinity;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    note: "",
  });

  // Address cascade state
  interface AreaItem {
    code: string;
    name: string;
  }
  const [provinces, setProvinces] = useState<AreaItem[]>([]);
  const [districts, setDistricts] = useState<AreaItem[]>([]);
  const [wards, setWards] = useState<AreaItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [selectedWardName, setSelectedWardName] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Merged-area warning
  const [provinceWarning, setProvinceWarning] = useState("");
  const [districtWarning, setDistrictWarning] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch provinces on mount
  useEffect(() => {
    setLoadingProvinces(true);
    fetch(`${API}/areas/provinces`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "Success") setProvinces(data.results || []);
      })
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset form when switching to "Nhập địa chỉ khác"
  useEffect(() => {
    if (showNewAddressForm) {
      setForm({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        district: "",
        note: "",
      });
      setSelectedProvinceCode("");
      setSelectedDistrictCode("");
      setSelectedWardCode("");
      setSelectedWardName("");
      setDistricts([]);
      setWards([]);
      setSaveAddress(false);
    }
  }, [showNewAddressForm]);

  // Auto-fill form when a saved address is selected
  useEffect(() => {
    if (!selectedAddressId) return;

    const { getAddresses, getUserProfile } = require("@/lib/api/user");
    getAddresses(token ?? "")
      .then(async (addresses: Address[]) => {
        const addr = addresses.find((a: Address) => a.id === selectedAddressId);
        if (!addr) return;

        setForm({
          fullName: addr.fullName,
          email: "",
          phone: addr.phone,
          address: addr.address,
          city: addr.city,
          district: addr.district,
          note: "",
        });
        setSelectedWardName(addr.ward || "");
        setSelectedWardCode("");

        // Fetch user profile for email
        getUserProfile(token ?? "")
          .then((profile: any) => {
            if (profile.email) {
              setForm((prev: any) => ({ ...prev, email: profile.email }));
            }
          })
          .catch(() => {});

        // Province/district cascade:
        // Try direct match first, then fallback by scanning districts for addr.district
        let prov = provinces.find(
          (p: AreaItem) => p.code === addr.city || p.name === addr.city,
        );

        if (!prov && addr.city && addr.district) {
          // eslint-disable-next-line no-unreachable
          await (async () => {
            for (const p of provinces) {
              try {
                const resp = await fetch(
                  `${API}/areas/districts?province=${encodeURIComponent(p.code)}`,
                );
                const data = await resp.json();
                const found = data.results?.some(
                  (d: AreaItem) =>
                    d.code === addr.district || d.name === addr.district,
                );
                if (found) {
                  prov = p;
                  break;
                }
              } catch {
                /* skip */
              }
            }
          })();
        }

        if (prov) {
          setSelectedProvinceCode(prov.code);
          fetch(
            `${API}/areas/districts?province=${encodeURIComponent(prov.code)}`,
          )
            .then((r) => r.json())
            .then((data: any) => {
              if (data.status === "Success") {
                setDistricts(data.results || []);
                const dist = data.results?.find(
                  (d: AreaItem) =>
                    d.code === addr.district || d.name === addr.district,
                );
                if (dist) {
                  setSelectedDistrictCode(dist.code);
                  if (addr.ward) {
                    fetch(
                      `${API}/areas/communes?district=${encodeURIComponent(dist.code)}`,
                    )
                      .then((r2) => r2.json())
                      .then((data2: any) => {
                        if (data2.status === "Success") {
                          setWards(data2.results || []);
                          const ward = data2.results?.find(
                            (w: AreaItem) => w.name === addr.ward,
                          );
                          if (ward) {
                            setSelectedWardCode(ward.code);
                            setSelectedWardName(ward.name);
                          } else {
                            setSelectedWardName(addr.ward ?? "");
                          }
                        } else {
                          setSelectedWardName(addr.ward ?? "");
                        }
                      })
                      .catch(() => setSelectedWardName(addr.ward ?? ""));
                  }
                } else if (addr.district) {
                  setForm((f) => ({ ...f, district: addr.district }));
                }
              }
            })
            .catch(() => {
              setForm((f) => ({
                ...f,
                city: addr.city,
                district: addr.district,
              }));
            });
        } else if (addr.city) {
          setForm((f) => ({ ...f, city: addr.city, district: addr.district }));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, provinces.length]);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrictCode("");
      setSelectedWardCode("");
      setForm((f) => ({ ...f, city: "", district: "" }));
      setProvinceWarning("");
      setDistrictWarning("");
      return;
    }
    setLoadingDistricts(true);
    setWards([]);
    setSelectedDistrictCode("");
    setSelectedWardCode("");
    setDistrictWarning("");
    const prov = provinces.find((p) => p.code === selectedProvinceCode);
    setForm((f) => ({ ...f, city: prov?.name || "", district: "" }));
    fetch(
      `${API}/areas/districts?province=${encodeURIComponent(selectedProvinceCode)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "Success") {
          setDistricts(data.results || []);
          if (!data.results?.length) {
            setProvinceWarning(
              `Tỉnh "${prov?.name}" không có quận/huyện nào trong hệ thống. Vui lòng liên hệ hotline để được hỗ trợ.`,
            );
          }
        }
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceCode]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      setSelectedWardCode("");
      setForm((f) => ({ ...f, district: "" }));
      setDistrictWarning("");
      return;
    }
    setLoadingWards(true);
    setSelectedWardCode("");
    const dist = districts.find((d) => d.code === selectedDistrictCode);
    setForm((f) => ({ ...f, district: dist?.name || "" }));
    fetch(
      `${API}/areas/communes?district=${encodeURIComponent(selectedDistrictCode)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "Success") {
          setWards(data.results || []);
          if (!data.results?.length) {
            setDistrictWarning(
              `Quận "${dist?.name}" không có phường/xã nào trong hệ thống. Địa chỉ giao hàng có thể đã bị sáp nhập. Vui lòng liên hệ hotline để được hỗ trợ.`,
            );
          }
        }
      })
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictCode]);

  // Calculate shipping fee — fixed fee từ admin settings
  const { totalPrice, totalItems } = useCart();
  const isFreeShipping =
    totalPrice >= FREE_SHIPPING_THRESHOLD || totalItems >= 2;
  const displayedShippingFee = isFreeShipping ? 0 : DEFAULT_SHIPPING_FEE;

  const handleWardChange = (code: string) => {
    setSelectedWardCode(code);
    const ward = wards.find((w) => w.code === code);
    setSelectedWardName(ward?.name || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields for new address form
    const errors: Record<string, string> = {};
    if (showNewAddressForm || !token) {
      if (!form.fullName.trim()) errors.fullName = "Vui lòng nhập họ tên.";
      if (!form.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại.";
      if (!form.email.trim()) errors.email = "Vui lòng nhập email.";
      if (!selectedProvinceCode)
        errors.province = "Vui lòng chọn Tỉnh/Thành phố.";
      if (!selectedDistrictCode) errors.district = "Vui lòng chọn Quận/Huyện.";
      if (!form.address.trim())
        errors.address = "Vui lòng nhập địa chỉ chi tiết.";
      if (selectedProvinceCode && selectedDistrictCode && !selectedWardCode) {
        errors.ward = "Vui lòng chọn Phường/Xã.";
      }
    }

    if (!showNewAddressForm && !selectedAddressId && !!token) {
      errors.addressSelect = "Vui lòng chọn hoặc nhập địa chỉ giao hàng.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFormErrors({});

    // Save new address if user checked the option
    if (showNewAddressForm && saveAddress && token) {
      setSavingAddress(true);
      try {
        const prov = provinces.find(
          (p: AreaItem) => p.code === selectedProvinceCode,
        );
        const dist = districts.find(
          (d: AreaItem) => d.code === selectedDistrictCode,
        );
        await createAddress(
          {
            fullName: form.fullName,
            phone: form.phone,
            address: form.address,
            city: prov?.name || form.city,
            district: dist?.name || form.district,
            ward: selectedWardName || undefined,
            postalCode: selectedWardCode || undefined,
          },
          token,
        );
      } catch {
        // Address save is non-critical — proceed anyway
      } finally {
        setSavingAddress(false);
      }
    }

    const fullAddress = selectedWardName
      ? `${form.address}, ${selectedWardName}`
      : form.address;
    onNext({
      ...form,
      address: fullAddress,
      wardName: selectedWardName,
      shippingFee: displayedShippingFee,
    });
  };

  const selectClass =
    "w-full bg-white border-b-2 py-3 focus:outline-none transition-colors font-medium cursor-pointer appearance-none";
  const selectErrorClass = "border-red-400 focus:border-red-500";
  const selectNormalClass = "border-zinc-200 focus:border-black";
  const inputClass =
    "w-full bg-white border-b-2 py-3 focus:outline-none transition-colors font-medium";
  const inputErrorClass = "border-red-400 focus:border-red-500";
  const inputNormalClass = "border-zinc-200 focus:border-black";

  // Determine what to show:
  // - No address selected & no new form = show AddressSelector
  // - Address selected OR new form = show form fields
  const showFormFields =
    showNewAddressForm || selectedAddressId !== null || !token;

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <h2 className="text-2xl font-black uppercase tracking-tighter">
        1. Thông tin giao hàng
      </h2>

      {/* Address selection for logged-in users */}
      {token && !showNewAddressForm && (
        <AddressSelector
          token={token}
          selectedAddressId={selectedAddressId}
          onSelect={onSelectAddress}
          onNewAddress={onToggleNewAddress}
          onDeleted={(deletedId) => {
            if (selectedAddressId === deletedId) {
              onAddressDeleted();
            }
          }}
        />
      )}

      {/* Divider */}
      {token && showFormFields && (
        <div className="border-t border-zinc-200 pt-8">
          {selectedAddressId && !showNewAddressForm && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={onToggleNewAddress}
                className="text-xs text-zinc-500 hover:text-black underline underline-offset-2 transition-colors"
              >
                Nhập địa chỉ khác
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form fields (always visible for guests, shown when address selected or new form toggled) */}
      {(showNewAddressForm || !token || selectedAddressId) && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Họ và tên *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => {
                  setForm({ ...form, fullName: e.target.value });
                  setFormErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                className={`${inputClass} ${formErrors.fullName ? inputErrorClass : inputNormalClass}`}
                placeholder=""
              />
              {formErrors.fullName && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.fullName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Số điện thoại *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  setFormErrors((prev) => ({ ...prev, phone: "" }));
                }}
                className={`${inputClass} ${formErrors.phone ? inputErrorClass : inputNormalClass}`}
                placeholder=""
              />
              {formErrors.phone && (
                <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Email nhận thông báo *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setFormErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={`${inputClass} ${formErrors.email ? inputErrorClass : inputNormalClass}`}
              placeholder=""
            />
            {formErrors.email && (
              <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
            )}
          </div>

          {/* === CASCADING ADDRESS SELECTORS === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tỉnh / Thành phố */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Tỉnh / Thành phố *
              </label>
              <div className="relative">
                <select
                  value={selectedProvinceCode}
                  onChange={(e) => {
                    setSelectedProvinceCode(e.target.value);
                    setFormErrors((prev) => ({ ...prev, province: "" }));
                  }}
                  className={`${selectClass} ${formErrors.province ? selectErrorClass : selectNormalClass}`}
                  disabled={loadingProvinces}
                >
                  <option value="">
                    {loadingProvinces ? "Đang tải..." : "CHỌN TỈNH/THÀNH PHỐ"}
                  </option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {loadingProvinces && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {formErrors.province && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.province}
                </p>
              )}
            </div>

            {/* Quận / Huyện */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Quận / Huyện *
              </label>
              <div className="relative">
                <select
                  value={selectedDistrictCode}
                  onChange={(e) => {
                    setSelectedDistrictCode(e.target.value);
                    setFormErrors((prev) => ({ ...prev, district: "" }));
                  }}
                  className={`${selectClass} ${formErrors.district ? selectErrorClass : selectNormalClass}`}
                  disabled={!selectedProvinceCode || loadingDistricts}
                >
                  <option value="">
                    {loadingDistricts
                      ? "Đang tải..."
                      : !selectedProvinceCode
                        ? "CHỌN TỈNH TRƯỚC"
                        : "CHỌN QUẬN/HUYỆN"}
                  </option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {loadingDistricts && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {provinceWarning && (
                <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" x2="12" y1="9" y2="13" />
                    <line x1="12" x2="12.01" y1="17" y2="17" />
                  </svg>
                  {provinceWarning}
                </p>
              )}
              {formErrors.district && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.district}
                </p>
              )}
            </div>

            {/* Phường / Xã */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Phường / Xã *
              </label>
              <div className="relative">
                <select
                  value={selectedWardCode}
                  onChange={(e) => {
                    handleWardChange(e.target.value);
                    setFormErrors((prev) => ({ ...prev, ward: "" }));
                  }}
                  className={`${selectClass} ${formErrors.ward ? selectErrorClass : selectNormalClass}`}
                  disabled={!selectedDistrictCode || loadingWards}
                >
                  <option value="">
                    {loadingWards
                      ? "Đang tải..."
                      : !selectedDistrictCode
                        ? "CHỌN QUẬN TRƯỚC"
                        : "CHỌN PHƯỜNG/XÃ"}
                  </option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {loadingWards && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {districtWarning && (
                <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" x2="12" y1="9" y2="13" />
                    <line x1="12" x2="12.01" y1="17" y2="17" />
                  </svg>
                  {districtWarning}
                </p>
              )}
              {formErrors.ward && (
                <p className="text-xs text-red-500 mt-1">{formErrors.ward}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Địa chỉ chi tiết (Số nhà, tên đường) *
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => {
                setForm({ ...form, address: e.target.value });
                setFormErrors((prev) => ({ ...prev, address: "" }));
              }}
              className={`${inputClass} ${formErrors.address ? inputErrorClass : inputNormalClass}`}
              placeholder=""
            />
            {formErrors.address && (
              <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
            )}
          </div>

          {/* Preview full address */}
          {form.city && form.district && selectedWardName && form.address && (
            <div className="bg-zinc-50 border border-zinc-200 p-4 animate-fade-in">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                Địa chỉ đầy đủ
              </p>
              <p className="text-sm font-medium text-zinc-800">
                {form.address}, {selectedWardName}, {form.district}, {form.city}
              </p>
            </div>
          )}

          {/* Shipping fee notice */}
          {selectedProvinceCode && selectedDistrictCode && (
            <div className="bg-zinc-50 border border-zinc-200 p-4 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Phí vận chuyển
                </span>
                <span className="text-sm font-bold text-black">
                  {isFreeShipping ? (
                    <span className="text-green-600">MIỄN PHÍ</span>
                  ) : (
                    formatPrice(displayedShippingFee)
                  )}
                </span>
              </div>
              <div className="space-y-1">
                {totalPrice < FREE_SHIPPING_THRESHOLD && totalItems < 2 && (
                  <p className="text-[10px] text-zinc-400">
                    Miễn phí giao hàng đơn từ 2 sản phẩm
                  </p>
                )}
                {totalPrice >= FREE_SHIPPING_THRESHOLD && totalItems < 2 && (
                  <p className="text-[10px] text-green-600">
                    Đơn hàng từ {formatPrice(FREE_SHIPPING_THRESHOLD)} — Miễn
                    phí vận chuyển
                  </p>
                )}
                {totalItems >= 2 && (
                  <p className="text-[10px] text-green-600">
                    Tối thiểu 2 sản phẩm — Miễn phí vận chuyển
                  </p>
                )}
                <p className="text-[10px] text-zinc-400">
                  Phí ship bên shipper sẽ thu shop khi lấy hàng
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Ghi chú thêm
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 p-4 min-h-[100px] focus:border-black focus:outline-none transition-colors font-medium text-sm"
              placeholder=""
            />
          </div>

          {showNewAddressForm && token && (
            <div className="space-y-3">
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
                  onClick={onToggleNewAddress}
                  className="text-xs text-zinc-500 hover:text-black underline underline-offset-2 transition-colors"
                >
                  Chọn địa chỉ đã lưu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-6">
        <button
          type="submit"
          disabled={
            !showFormFields ||
            (!showNewAddressForm && !selectedAddressId && !!token) ||
            savingAddress
          }
          className="btn-primary px-12 py-4 disabled:opacity-40"
        >
          {savingAddress ? "Đang lưu địa chỉ..." : "Tiếp tục thanh toán"}
        </button>
      </div>
    </form>
  );
}

// ============================================
// Step 2: Payment Method
// ============================================
function PaymentForm({
  onNext,
  onBack,
  paymentMethod,
  setPaymentMethod,
  isFirstOrder,
  grandTotal,
  isAuthenticated,
}: {
  onNext: () => void;
  onBack: () => void;
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
  isFirstOrder: boolean;
  grandTotal: number;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const { get } = useSiteTexts();

  const handleNext = () => {
    onNext();
  };

  const methods = [
    {
      id: "COD",
      label: "Thanh toán khi nhận hàng (COD)",
      desc: "Trả tiền mặt cho shipper khi nhận được hàng",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
    },
    // {
    //   id: "VNPAY",
    //   label: get('payment.vnpay_label', 'VNPay (QR Code / Thẻ ATM)'),
    //   desc: get('payment.vnpay_desc', 'Thanh toán qua cổng VNPay an toàn và nhanh chóng'),
    //   icon: (
    //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    //       <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    //       <path d="M8 10h.01M12 10h.01M16 10h.01" />
    //     </svg>
    //   ),
    // },
    {
      id: "BANK_TRANSFER",
      label: get(
        "payment.bank_transfer_label",
        "Chuyển khoản ngân hàng trực tiếp",
      ),
      desc: get(
        "payment.bank_transfer_desc",
        "Chuyển tiền trực tiếp vào tài khoản THRIFT.VN để được ưu đãi quà tặng",
      ),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <line x1="3" x2="21" y1="22" y2="22" />
          <line x1="6" x2="6" y1="18" y2="11" />
          <line x1="10" x2="10" y1="18" y2="11" />
          <line x1="14" x2="14" y1="18" y2="11" />
          <line x1="18" x2="18" y1="18" y2="11" />
          <polygon points="12 2 20 7 4 7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-black uppercase tracking-tighter">
        2. Phương thức thanh toán
      </h2>

      <div className="space-y-4">
        {methods.map((m) => (
          <label
            key={m.id}
            className={`flex items-start gap-5 p-8 border-2 cursor-pointer transition-all duration-300 ${
              paymentMethod === m.id
                ? "border-black bg-zinc-50"
                : "border-zinc-100 hover:border-zinc-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 ${
                paymentMethod === m.id ? "border-black" : "border-zinc-300"
              }`}
            >
              {paymentMethod === m.id && (
                <div className="w-2.5 h-2.5 bg-black rounded-full" />
              )}
            </div>
            <input
              type="radio"
              name="payment"
              value={m.id}
              checked={paymentMethod === m.id}
              onChange={() => setPaymentMethod(m.id)}
              className="sr-only"
            />
            <div
              className={`${paymentMethod === m.id ? "text-black" : "text-zinc-400"}`}
            >
              {m.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold text-zinc-900 uppercase tracking-wide text-sm">
                {m.label}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{m.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {paymentMethod === "COD" && isFirstOrder && (
        <div className="p-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm space-y-2 animate-fade-in">
          <p className="font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" x2="12" y1="9" y2="13" />
              <line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
            Yêu cầu đặt cọc 10%
          </p>
          {!isAuthenticated ? (
            <p>
              Khách vãng lai (chưa đăng nhập) vui lòng chuyển khoản đặt cọc{" "}
              <strong>10% ({formatPrice(grandTotal * 0.1)})</strong> để xác nhận
              đơn hàng COD. Số tiền này sẽ được trừ trực tiếp khi bạn nhận hàng.
              <br />
              Hoặc bạn có thể{" "}
              <Link
                href="/auth/login?redirect=/checkout"
                className="underline font-bold text-amber-900"
              >
                Đăng nhập
              </Link>{" "}
              để mua hàng và nhận các ưu đãi.
            </p>
          ) : (
            <p>
              Vì đây là đơn hàng đầu tiên của bạn, vui lòng chuyển khoản đặt cọc{" "}
              <strong>10% ({formatPrice(grandTotal * 0.1)})</strong> để chúng
              tôi xác nhận đơn hàng COD. Số tiền này sẽ được trừ trực tiếp khi
              bạn nhận hàng.
            </p>
          )}
        </div>
      )}

      {paymentMethod === "VNPAY" && (
        <div className="p-6 bg-blue-50 border border-blue-200 text-blue-800 text-sm space-y-2">
          <p className="font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Thanh toán qua VNPay
          </p>
          <p>
            {get(
              "payment.vnpay_notice",
              "Sau khi xác nhận, bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất.",
            )}
          </p>
        </div>
      )}

      {paymentMethod === "BANK_TRANSFER" && (
        <div className="p-6 bg-green-50 border border-green-200 text-green-800 text-sm space-y-2">
          <p className="font-bold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01" />
            </svg>
            Quét mã VietQR tự động
          </p>
          <p>
            {get(
              "payment.qr_instruction",
              "Sau khi xác nhận đơn hàng, hệ thống sẽ tạo một mã QR chứa chính xác số tiền và mã đơn hàng của bạn. Bạn chỉ cần mở App ngân hàng quét để thanh toán nhanh chóng.",
            )}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-6">
        <button onClick={onBack} className="btn-ghost px-10">
          Quay lại
        </button>
        <button onClick={handleNext} className="btn-primary px-12 py-4">
          Xác nhận đơn hàng
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 3: Order Confirmation
// ============================================
function OrderSummaryStep({
  shippingInfo,
  paymentMethod,
  onBack,
  grandTotal,
  onOrderDone,
}: {
  shippingInfo: ShippingInfo;
  paymentMethod: string;
  onBack: () => void;
  grandTotal: number;
  onOrderDone: (orderId: string) => void;
}) {
  const router = useRouter();
  const { get } = useSiteTexts();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const { clearCart, items } = useCart();

  const handlePlace = async () => {
    setPlacing(true);
    setError("");

    try {
      const order = await createOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size,
        })),
        shippingName: shippingInfo.fullName,
        shippingPhone: shippingInfo.phone,
        shippingEmail: shippingInfo.email,
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingDistrict: shippingInfo.district,
        shippingWard: shippingInfo.wardName || "",
        orderNote: shippingInfo.note,
        paymentMethod,
        shippingFee: shippingInfo.shippingFee,
      });

      if (paymentMethod === "VNPAY") {
        try {
          const { paymentUrl } = await createVNPayUrl(
            order.id,
            grandTotal,
            `ORD-${order.id.slice(-8).toUpperCase()}`,
          );
          if (!paymentUrl)
            throw new Error("Không nhận được liên kết thanh toán từ VNPay.");
          setRedirecting(true);
          clearCart();
          window.location.href = paymentUrl;
          return;
        } catch (err: any) {
          const status = err.status;
          const msg = err.message || "";

          if (
            status === 401 ||
            msg.includes("đăng nhập") ||
            msg.includes("token")
          ) {
            router.push("/auth/login?redirect=/checkout");
            return;
          } else if (status === 403) {
            setError(
              "Bạn không có quyền thanh toán đơn hàng này. Đơn hàng đã được tạo với mã: ORD-" +
                order.id.slice(0, 8).toUpperCase() +
                ". Nếu bạn chưa đăng nhập, vui lòng đăng nhập trước khi thanh toán qua VNPay.",
            );
          } else if (status === 409) {
            setError(
              "Đơn hàng này đã được thanh toán hoặc đang chờ thanh toán. Mã đơn: ORD-" +
                order.id.slice(0, 8).toUpperCase() +
                ". Vui lòng kiểm tra lại đơn hàng.",
            );
          } else if (status === 429) {
            setError(
              "Bạn đã vượt quá số lần thanh toán cho phép (3 lần). Vui lòng tạo đơn hàng mới.",
            );
          } else if (status === 404) {
            setError(
              "Không tìm thấy đơn hàng. Vui lòng liên hệ hotline: " +
                get("contact.hotline", "1900 1234") +
                ".",
            );
          } else {
            setError(
              "Không thể kết nối cổng thanh toán VNPay. Đơn hàng đã được tạo thành công trong hệ thống. " +
                "Vui lòng thử lại hoặc liên hệ hotline: " +
                get("contact.hotline", "1900 1234") +
                ". " +
                `Mã đơn: ORD-${order.id.slice(0, 8).toUpperCase()}`,
            );
          }
          setPlacing(false);
          return;
        }
      }

      if (paymentMethod === "BANK_TRANSFER" || order.isDepositRequired) {
        router.push(`/checkout/payment-qr/${order.id}`);
        setTimeout(() => clearCart(), 1000);
        return;
      }

      // COD: clear cart then notify parent to show success
      clearCart();
      onOrderDone(order.id);
    } catch (err: any) {
      if (err.status === 401 || err.message?.includes("đăng nhập")) {
        router.push("/auth/login?redirect=/checkout");
        return;
      }
      setError(err.message || "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setPlacing(false);
    }
  };

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm font-medium">
          Đang chuyển hướng đến VNPay...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-black uppercase tracking-tighter">
        3. Hoàn tất đơn hàng
      </h2>

      <div className="bg-zinc-900 text-white p-8 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red opacity-10 blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" />

        <div className="flex items-center gap-4 text-brand-red">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span className="font-bold uppercase tracking-widest text-sm">
            Cam kết từ Thrift.vn
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-zinc-400 font-medium leading-relaxed">
          <p>
            Mọi sản phẩm đã được kiểm tra và xác thực bởi đội ngũ chuyên gia của
            chúng tôi.
          </p>
          <p>
            Quy trình đóng gói cao cấp đảm bảo an toàn tuyệt đối cho hàng xa xỉ
            trong quá trình vận chuyển.
          </p>
          <p>Chính sách hoàn tiền 100% nếu phát hiện hàng không chính hãng.</p>
          <p>Hỗ trợ kỹ thuật và tư vấn bảo dưỡng trọn đời cho mọi đơn hàng.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-6">
        <button onClick={onBack} className="btn-ghost px-10">
          Quay lại
        </button>
        <button
          onClick={handlePlace}
          disabled={placing}
          className="btn-primary px-12 py-4 disabled:opacity-50"
        >
          {placing ? "ĐANG XỬ LÝ ĐƠN HÀNG..." : "XÁC NHẬN ĐẶT HÀNG"}
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
