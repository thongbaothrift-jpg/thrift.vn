"use client";

import { useState, useEffect } from "react";
import { getAddresses, deleteAddress, type Address } from "@/lib/api/user";

interface AddressSelectorProps {
  token: string | null;
  onSelect: (address: Address) => void;
  onNewAddress: () => void;
  selectedAddressId?: string | null;
  onDeleted?: (addressId: string) => void;
}

export function AddressSelector({
  token,
  onSelect,
  onNewAddress,
  selectedAddressId,
  onDeleted,
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    getAddresses(token)
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (e: React.MouseEvent, addressId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Xóa địa chỉ này?")) return;
    try {
      await deleteAddress(addressId, token!);
      const updated = addresses.filter((a) => a.id !== addressId);
      setAddresses(updated);
      onDeleted?.(addressId);
    } catch {
      alert("Xóa địa chỉ thất bại.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-zinc-100 rounded animate-pulse w-40 mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-zinc-50 rounded border border-zinc-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-500">Chưa có địa chỉ nào được lưu.</p>
        <button onClick={onNewAddress} className="btn-secondary text-sm">
          Nhập địa chỉ mới
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
        Chọn địa chỉ đã lưu
      </p>
      {addresses.map((addr) => {
        const isSelected = selectedAddressId === addr.id;
        return (
          <label
            key={addr.id}
            className={`flex items-start gap-4 p-5 border-2 cursor-pointer transition-all ${
              isSelected
                ? "border-black bg-zinc-50"
                : "border-zinc-100 hover:border-zinc-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                isSelected ? "border-black" : "border-zinc-300"
              }`}
            >
              {isSelected && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
            </div>
            <input
              type="radio"
              name="saved-address"
              value={addr.id}
              checked={isSelected}
              onChange={() => onSelect(addr)}
              className="sr-only"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-sm">{addr.fullName}</span>
                <span className="text-zinc-400 text-xs">{addr.phone}</span>
                {addr.isDefault && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-600 rounded">
                    Mặc định
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {addr.address}
                {addr.district ? `, ${addr.district}` : ""}
                {addr.city ? `, ${addr.city}` : ""}
              </p>
            </div>
            {!addr.isDefault && (
              <button
                onClick={(e) => handleDelete(e, addr.id)}
                className="flex-shrink-0 text-zinc-300 hover:text-red-500 transition-colors p-1"
                title="Xóa địa chỉ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            )}
          </label>
        );
      })}

      <button
        onClick={onNewAddress}
        className="w-full mt-2 px-4 py-3 text-sm font-medium text-zinc-500 border border-dashed border-zinc-300 hover:border-zinc-500 hover:text-zinc-700 transition-colors text-center rounded"
      >
        + Sử dụng địa chỉ khác (nhập mới)
      </button>
    </div>
  );
}
