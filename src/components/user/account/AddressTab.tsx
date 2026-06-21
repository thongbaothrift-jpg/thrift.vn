"use client";

import { useState, useEffect } from "react";
import { getAddresses, deleteAddress, updateAddress, type Address } from "@/lib/api/user";
import { AddressForm } from "./AddressForm";

interface AddressTabProps {
  token: string;
}

export function AddressTab({ token }: AddressTabProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAddresses = () => {
    setLoading(true);
    getAddresses(token)
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAddresses();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa địa chỉ này không?")) return;
    setDeletingId(id);
    try {
      await deleteAddress(id, token);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || "Xóa địa chỉ thất bại.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      await updateAddress(address.id, { isDefault: true }, token);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === address.id }))
      );
    } catch (err: any) {
      alert(err.message || "Không thể đặt địa chỉ mặc định.");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAddress(null);
    fetchAddresses();
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-tight">Địa chỉ của tôi</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" x2="12" y1="5" y2="19" />
                <line x1="5" x2="19" y1="12" y2="12" />
              </svg>
              Thêm địa chỉ mới
            </span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border border-zinc-200 p-8 mb-8">
          <h3 className="font-bold text-lg mb-6">
            {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h3>
          <AddressForm
            initialData={editingAddress ?? undefined}
            token={token}
            onSuccess={handleFormSuccess}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* Address List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-zinc-200 p-6">
              <div className="h-4 bg-zinc-100 rounded animate-pulse w-48 mb-3" />
              <div className="h-3 bg-zinc-100 rounded animate-pulse w-64 mb-2" />
              <div className="h-3 bg-zinc-100 rounded animate-pulse w-40" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="text-center py-20 bg-white border border-zinc-100">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <p className="text-zinc-500 mb-6">Bạn chưa lưu địa chỉ nào.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Thêm địa chỉ đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white border-2 p-6 transition-colors ${
                addr.isDefault ? "border-black" : "border-zinc-100 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <p className="font-bold text-base">{addr.fullName}</p>
                      <span className="text-zinc-300 text-sm">{addr.phone}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black text-white">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {addr.address}
                      {addr.ward ? `, ${addr.ward}` : ""}
                      {addr.district ? `, ${addr.district}` : ""}
                      {addr.city ? `, ${addr.city}` : ""}
                      {addr.postalCode ? ` ${addr.postalCode}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      className="px-3 py-1.5 text-xs font-semibold border border-zinc-300 text-zinc-600 hover:border-black hover:text-black transition-colors rounded"
                    >
                      Đặt mặc định
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(addr)}
                    className="px-3 py-1.5 text-xs font-semibold border border-zinc-300 text-zinc-600 hover:border-black hover:text-black transition-colors rounded"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-500 hover:border-red-500 hover:bg-red-50 transition-colors rounded disabled:opacity-50"
                  >
                    {deletingId === addr.id ? "..." : "Xóa"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
