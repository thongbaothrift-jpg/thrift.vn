"use client";

import { useState, useEffect, useCallback } from "react";
import { updateBankConfig, type ShopConfig } from "@/lib/api/admin";
import {
  Save,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Building2,
  CreditCard,
  User,
  MapPin,
  Truck,
  RefreshCw,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface AreaItem {
  code: string;
  name: string;
}

export function SettingsPageClient({
  initialBankConfig,
}: {
  initialBankConfig: ShopConfig;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [config, setConfig] = useState<ShopConfig>(initialBankConfig);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  // Cascade address state
  const [provinces, setProvinces] = useState<AreaItem[]>([]);
  const [districts, setDistricts] = useState<AreaItem[]>([]);
  const [wards, setWards] = useState<AreaItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Sync initial pickup address into dropdown state
  useEffect(() => {
    if (!initialBankConfig.pickupProvince) return;
    setLoadingProvinces(true);
    fetch(`${API}/areas/provinces`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "Success") return;
        const list = data.results || [];
        setProvinces(list);
        const match = list.find(
          (p: AreaItem) => p.name === initialBankConfig.pickupProvince,
        );
        if (match) {
          setSelectedProvinceCode(match.code);
          // load districts
          fetch(
            `${API}/areas/districts?province=${encodeURIComponent(match.code)}`,
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.status !== "Success") return;
              const dists = d.results || [];
              setDistricts(dists);
              const dMatch = dists.find(
                (dd: AreaItem) => dd.name === initialBankConfig.pickupDistrict,
              );
              if (dMatch) {
                setSelectedDistrictCode(dMatch.code);
                // load wards
                fetch(
                  `${API}/areas/communes?district=${encodeURIComponent(dMatch.code)}`,
                )
                  .then((w) => w.json())
                  .then((wd) => {
                    if (wd.status !== "Success") return;
                    const ws = wd.results || [];
                    setWards(ws);
                    const wMatch = ws.find(
                      (ww: AreaItem) =>
                        ww.name === initialBankConfig.pickupWard,
                    );
                    if (wMatch) setSelectedWardCode(wMatch.code);
                  })
                  .catch(() => {});
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProvinces(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrictCode("");
      setSelectedWardCode("");
      return;
    }
    setLoadingDistricts(true);
    setWards([]);
    setSelectedDistrictCode("");
    setSelectedWardCode("");
    const prov = provinces.find((p) => p.code === selectedProvinceCode);
    if (prov) {
      setConfig((c) => ({ ...c, pickupProvince: prov.name }));
    }
    fetch(
      `${API}/areas/districts?province=${encodeURIComponent(selectedProvinceCode)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "Success") setDistricts(d.results || []);
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [selectedProvinceCode, provinces, API]);

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      setSelectedWardCode("");
      return;
    }
    setLoadingWards(true);
    setSelectedWardCode("");
    const dist = districts.find((d) => d.code === selectedDistrictCode);
    if (dist) {
      setConfig((c) => ({ ...c, pickupDistrict: dist.name }));
    }
    fetch(
      `${API}/areas/communes?district=${encodeURIComponent(selectedDistrictCode)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "Success") setWards(d.results || []);
      })
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  }, [selectedDistrictCode, districts, API]);

  // Update ward name when ward changes
  useEffect(() => {
    if (!selectedWardCode) return;
    const ward = wards.find((w) => w.code === selectedWardCode);
    if (ward) {
      setConfig((c) => ({ ...c, pickupWard: ward.name }));
    }
  }, [selectedWardCode, wards]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateBankConfig(config);
      setSuccess("Cập nhật thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncAreas = useCallback(async () => {
    if (
      !confirm(
        "Sync dữ liệu Tỉnh/Quận/Phường từ SuperShip? Thao tác này sẽ ghi đè file dữ liệu hiện tại.",
      )
    )
      return;
    setIsSyncing(true);
    setSyncMsg("");
    setError("");
    try {
      const res = await fetch(`${API}/api/areas/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync thất bại");
      setSyncMsg(data.message || "Sync thành công!");
      setTimeout(() => setSyncMsg(""), 5000);
    } catch (err: any) {
      setError(err.message || "Lỗi khi sync");
    } finally {
      setIsSyncing(false);
    }
  }, [API]);

  const selectClass =
    "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none transition-all cursor-pointer";

  return (
    <div className="max-w-4xl space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3 text-sm font-bold animate-shake">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-2xl border border-green-100 flex items-center gap-3 text-sm font-bold">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* === BANK / VIETQR === */}
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-black">
                Tài khoản Ngân hàng (VietQR)
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                Cấu hình thanh toán tự động
              </p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Building2 size={14} className="text-zinc-300" />
                Tên ngân hàng *
              </label>
              <input
                type="text"
                value={config.bankName}
                onChange={(e) =>
                  setConfig({ ...config, bankName: e.target.value })
                }
                placeholder="VIETCOMBANK (VCB)"
                required
                className={selectClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <QrCode size={14} className="text-zinc-300" />
                Mã BIN (Bank ID) *
              </label>
              <input
                type="text"
                value={config.bankId}
                onChange={(e) =>
                  setConfig({ ...config, bankId: e.target.value })
                }
                placeholder="970436"
                required
                className={selectClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <CreditCard size={14} className="text-zinc-300" />
                Số tài khoản *
              </label>
              <input
                type="text"
                value={config.accountNumber}
                onChange={(e) =>
                  setConfig({ ...config, accountNumber: e.target.value })
                }
                placeholder="123456789012"
                required
                className={selectClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <User size={14} className="text-zinc-300" />
                Tên chủ tài khoản *
              </label>
              <input
                type="text"
                value={config.accountName}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    accountName: e.target.value.toUpperCase(),
                  })
                }
                placeholder="VIET HOA KHONG DAU"
                required
                className={selectClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* === PICKUP ADDRESS (SuperShip Cascading Dropdowns) === */}
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-black">
                Địa chỉ lấy hàng (SuperShip)
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                SuperShip lấy hàng tại đây — chọn chính xác theo hệ thống
                SuperShip
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {syncMsg && (
                <span className="text-xs text-green-600 font-bold">
                  {syncMsg}
                </span>
              )}
              <button
                onClick={handleSyncAreas}
                disabled={isSyncing}
                title="Sync dữ liệu Tỉnh/Quận/Phường từ SuperShip API"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-all"
              >
                <RefreshCw
                  size={12}
                  className={isSyncing ? "animate-spin" : ""}
                />
                {isSyncing ? "Đang sync..." : "Sync Areas"}
              </button>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Building2 size={14} className="text-zinc-300" />
                Tên cửa hàng
              </label>
              <input
                type="text"
                value={config.shopName}
                onChange={(e) =>
                  setConfig({ ...config, shopName: e.target.value })
                }
                placeholder="THRIFT.VN VIETNAM"
                className={selectClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <User size={14} className="text-zinc-300" />
                SĐT liên hệ lấy hàng
              </label>
              <input
                type="text"
                value={config.shopPhone}
                onChange={(e) =>
                  setConfig({ ...config, shopPhone: e.target.value })
                }
                placeholder="0912 345 678"
                className={selectClass}
              />
            </div>
          </div>

          {/* Cascade dropdowns */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Địa chỉ gửi hàng (SuperShip)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Province */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Tỉnh / Thành phố *
                </label>
                <div className="relative">
                  <select
                    value={selectedProvinceCode}
                    onChange={(e) => setSelectedProvinceCode(e.target.value)}
                    className={selectClass}
                    required
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Quận / Huyện *
                </label>
                <div className="relative">
                  <select
                    value={selectedDistrictCode}
                    onChange={(e) => setSelectedDistrictCode(e.target.value)}
                    className={selectClass}
                    required
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Ward */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Phường / Xã
                </label>
                <div className="relative">
                  <select
                    value={selectedWardCode}
                    onChange={(e) => setSelectedWardCode(e.target.value)}
                    className={selectClass}
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detail address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Địa chỉ chi tiết (số nhà, đường)
              </label>
              <input
                type="text"
                value={config.pickupAddress}
                onChange={(e) =>
                  setConfig({ ...config, pickupAddress: e.target.value })
                }
                placeholder="123 Nguyễn Trãi, Phường 14"
                className={selectClass}
              />
            </div>

            {/* Preview */}
            {config.pickupProvince &&
              config.pickupDistrict &&
              config.pickupAddress && (
                <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Preview địa chỉ lấy hàng
                  </p>
                  <p className="text-sm font-medium text-zinc-700">
                    {config.pickupAddress}
                    {config.pickupWard ? `, ${config.pickupWard}` : ""}
                    {config.pickupDistrict ? `, ${config.pickupDistrict}` : ""}
                    {config.pickupProvince ? `, ${config.pickupProvince}` : ""}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* === SHIPPING SETTINGS === */}
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-black">
                Cấu hình vận chuyển
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                Phí ship cố định &amp; ngưỡng miễn phí
              </p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Truck size={14} className="text-zinc-300" />
                Phí ship cố định (VND)
              </label>
              <input
                type="number"
                value={config.defaultShippingFee}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    defaultShippingFee: Number(e.target.value),
                  })
                }
                min={0}
                step={1000}
                className={selectClass}
              />
              <p className="text-[10px] text-zinc-400">
                Phí vận chuyển mặc định. Shipper thu shop khi lấy hàng.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Truck size={14} className="text-zinc-300" />
                Miễn phí vận chuyển cho đơn từ (VND)
              </label>
              <input
                type="number"
                value={config.freeShippingThreshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    freeShippingThreshold: Number(e.target.value),
                  })
                }
                min={0}
                step={10000}
                className={selectClass}
              />
              <p className="text-[10px] text-zinc-400">
                Đơn từ ngưỡng này hoặc tối thiểu 2 sản phẩm → miễn phí ship.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* === FOOTER BUSINESS INFO === */}
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-black">
                Thông tin công thương
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                Hiển thị ở Footer website
              </p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Building2 size={14} className="text-zinc-300" />
                Ảnh chứng nhận công thương
              </label>
              <input
                type="text"
                value={config.footerLogo || ""}
                onChange={(e) =>
                  setConfig({ ...config, footerLogo: e.target.value })
                }
                placeholder="URL ảnh (Google Drive hoặc link thường)"
                className={selectClass}
              />
              <p className="text-[10px] text-zinc-400">
                Dán link ảnh chứng nhận đã đăng ký kinh doanh.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <User size={14} className="text-zinc-300" />
                Chủ hộ kinh doanh
              </label>
              <input
                type="text"
                value={config.ownerName || ""}
                onChange={(e) =>
                  setConfig({ ...config, ownerName: e.target.value })
                }
                placeholder="VD: TRẦN MINH PHONG"
                className={selectClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Building2 size={14} className="text-zinc-300" />
                Tên giấy phép
              </label>
              <input
                type="text"
                value={config.businessLicense || ""}
                onChange={(e) =>
                  setConfig({ ...config, businessLicense: e.target.value })
                }
                placeholder="VD: GIẤY CHỨNG NHẬN ĐĂNG KÝ HỘ KINH DOANH"
                className={selectClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Building2 size={14} className="text-zinc-300" />
                Ngày cấp
              </label>
              <input
                type="text"
                value={config.licenseDate || ""}
                onChange={(e) =>
                  setConfig({ ...config, licenseDate: e.target.value })
                }
                placeholder="VD: cấp 26 tháng 09 năm 2023"
                className={selectClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
              <Building2 size={14} className="text-zinc-300" />
              Mã số thuế
            </label>
            <input
              type="text"
              value={config.taxCode || ""}
              onChange={(e) =>
                setConfig({ ...config, taxCode: e.target.value })
              }
              placeholder="VD: 025092008979"
              className={selectClass}
            />
          </div>
        </div>
      </div>

      {/* === SAVE + QR PREVIEW === */}
      <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
        {config.bankId && config.accountNumber && (
          <div className="mb-8 bg-zinc-50 border border-zinc-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8">
            <div className="w-40 h-40 bg-white border-4 border-zinc-50 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
              <img
                src={`https://img.vietqr.io/image/${config.bankId}-${config.accountNumber}-compact2.png?amount=100000&addInfo=TEST_QR&accountName=${encodeURIComponent(config.accountName)}`}
                alt="QR Preview"
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjEiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PGxpbmUgeDE9IjEyIiB5MT0iOCIgeDI9IjEyIiB5Mj0iMTIiLz48bGluZSB4MT0iMTIiIHkxPSIxNiIgeDI9IjEyLjAxIiB5Mj0iMTYiLz48L3N2Zz4=";
                }}
              />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest mb-2">
                Preview VietQR
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                VietQR tự động chèn số tiền &amp; nội dung theo từng đơn hàng
                khi khách thanh toán.
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-black text-white px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              "..."
            ) : (
              <>
                <Save size={16} /> Lưu cấu hình
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
