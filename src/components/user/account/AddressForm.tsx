"use client";

import { useState, useEffect } from "react";
import type { Address, CreateAddressRequest } from "@/lib/api/user";

interface AreaItem {
  code: string;
  name: string;
}

interface AddressFormProps {
  initialData?: Address;
  token: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function AddressForm({ initialData, token, onSuccess, onCancel }: AddressFormProps) {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [form, setForm] = useState({
    fullName: initialData?.fullName ?? "",
    phone: initialData?.phone ?? "",
    address: initialData?.address ?? "",
    postalCode: initialData?.postalCode ?? "",
    isDefault: initialData?.isDefault ?? false,
  });

  const [provinces, setProvinces] = useState<AreaItem[]>([]);
  const [districts, setDistricts] = useState<AreaItem[]>([]);
  const [wards, setWards] = useState<AreaItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState(initialData?.city ?? "");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState(initialData?.district ?? "");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [selectedWardName, setSelectedWardName] = useState("");

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Build display city / district from stored address
  const [storedProvinceName, setStoredProvinceName] = useState("");
  const [storedDistrictName, setStoredDistrictName] = useState("");

  // Fetch provinces
  useEffect(() => {
    setLoadingProvinces(true);
    fetch(`${API}/areas/provinces`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "Success") {
          setProvinces(data.results || []);
          // Resolve city name if editing
          if (initialData?.city && initialData?.district) {
            const prov = data.results?.find(
              (p: AreaItem) => p.code === initialData.city || p.name === initialData.city
            );
            if (prov) {
              setSelectedProvinceCode(prov.code);
              setStoredProvinceName(prov.name);
              // Fetch districts immediately
              setLoadingDistricts(true);
              fetch(`${API}/areas/districts?province=${encodeURIComponent(prov.code)}`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.status === "Success") {
                    setDistricts(d.results || []);
                    const dist = d.results?.find(
                      (dd: AreaItem) =>
                        dd.code === initialData.district || dd.name === initialData.district
                    );
                    if (dist) {
                      setSelectedDistrictCode(dist.code);
                      setStoredDistrictName(dist.name);
                      // Fetch wards and try to match if ward was saved
                      if (initialData?.ward) {
                        fetch(`${API}/areas/communes?district=${encodeURIComponent(dist.code)}`)
                          .then((r2) => r2.json())
                          .then((d2) => {
                            if (d2.status === "Success") {
                              setWards(d2.results || []);
                              const ward = d2.results?.find(
                                (w: AreaItem) => w.name === initialData.ward
                              );
                              if (ward) {
                                setSelectedWardCode(ward.code);
                                setSelectedWardName(ward.name);
                              }
                            }
                          });
                      }
                    }
                  }
                })
                .finally(() => setLoadingDistricts(false));
            }
          }
        }
      })
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch districts when province changes
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
    setStoredDistrictName("");
    const prov = provinces.find((p) => p.code === selectedProvinceCode);
    setStoredProvinceName(prov?.name ?? "");

    fetch(`${API}/areas/districts?province=${encodeURIComponent(selectedProvinceCode)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "Success") {
          setDistricts(data.results || []);
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
      setSelectedWardName("");
      return;
    }
    setLoadingWards(true);
    setSelectedWardCode("");
    setStoredDistrictName("");
    const dist = districts.find((d) => d.code === selectedDistrictCode);
    setStoredDistrictName(dist?.name ?? "");

    fetch(`${API}/areas/communes?district=${encodeURIComponent(selectedDistrictCode)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "Success") {
          setWards(data.results || []);
        }
      })
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictCode]);

  const handleWardChange = (code: string) => {
    setSelectedWardCode(code);
    const ward = wards.find((w) => w.code === code);
    setSelectedWardName(ward?.name ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cityValue = storedProvinceName || provinces.find((p) => p.code === selectedProvinceCode)?.name || "";
    const districtValue = storedDistrictName || districts.find((d) => d.code === selectedDistrictCode)?.name || "";

    const payload: CreateAddressRequest = {
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      city: cityValue,
      district: districtValue,
      ward: selectedWardName || undefined,
      postalCode: form.postalCode || undefined,
      isDefault: form.isDefault,
    };

    setSaving(true);
    try {
      const { updateAddress } = await import("@/lib/api/user");
      if (initialData) {
        await updateAddress(initialData.id, payload, token);
      } else {
        const { createAddress } = await import("@/lib/api/user");
        await createAddress(payload, token);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Lưu địa chỉ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-white border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium text-sm";
  const selectClass =
    "w-full bg-white border-b-2 border-zinc-200 py-3 focus:border-black focus:outline-none transition-colors font-medium cursor-pointer appearance-none text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Họ và tên *
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputClass}
            placeholder="NGUYỄN VĂN A"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Số điện thoại *
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
            placeholder="0912 345 678"
            required
          />
        </div>
      </div>

      {/* Province / District / Ward */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
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
                {loadingProvinces ? "Đang tải..." : "CHỌN TỈNH/TP"}
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
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
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
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Phường / Xã
          </label>
          <div className="relative">
            <select
              value={selectedWardCode}
              onChange={(e) => handleWardChange(e.target.value)}
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
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Địa chỉ chi tiết (Số nhà, tên đường) *
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className={inputClass}
          placeholder="VD: 123 NGUYỄN HUỆ, PHƯỜNG BẾN NGHÉ"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Mã bưu điện
        </label>
        <input
          type="text"
          value={form.postalCode}
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          className={inputClass}
          placeholder="VD: 70000"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            form.isDefault
              ? "bg-black border-black"
              : "border-zinc-300 group-hover:border-zinc-500"
          }`}
        >
          {form.isDefault && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          className="sr-only"
        />
        <span className="text-sm font-medium text-zinc-700">
          Đặt làm địa chỉ mặc định
        </span>
      </label>

      {/* Preview full address */}
      {storedProvinceName && storedDistrictName && form.address && (
        <div className="bg-zinc-50 border border-zinc-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Địa chỉ đầy đủ
          </p>
          <p className="text-sm font-medium text-zinc-800">
            {form.address}
            {selectedWardName ? `, ${selectedWardName}` : ""}, {storedDistrictName},{" "}
            {storedProvinceName}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Huỷ
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Đang lưu..." : initialData ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
        </button>
      </div>
    </form>
  );
}
