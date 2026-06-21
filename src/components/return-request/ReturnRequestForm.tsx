"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { convertDriveLink } from "@/lib/utils";
import { createReturnRequest } from "@/lib/api/orders";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface ReturnRequestFormProps {
  orderId: string;
  requireImage: boolean;
  onSuccess: () => void;
}

const RETURN_REASONS = [
  { value: "DEFECTIVE_PRODUCT", label: "Sản phẩm lỗi / không đúng mô tả" },
  { value: "WRONG_ITEM", label: "Giao sai sản phẩm" },
  { value: "SIZE_FIT_ISSUE", label: "Kích thước không phù hợp" },
  { value: "CHANGE_MIND", label: "Đổi ý" },
  { value: "OTHER", label: "Lý do khác" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(base64Str: string, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
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
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(base64Str);
  });
}

async function uploadImageToCloudinary(base64Data: string): Promise<string> {
  const response = await fetch(`${API_BASE}/upload/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Data }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error((err as any).error || "Upload failed");
  }
  const data = await response.json();
  return (data as { url: string }).url;
}

export function ReturnRequestForm({ orderId, requireImage, onSuccess }: ReturnRequestFormProps) {
  const [reason, setReason] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length >= 5) {
      setError("Tối đa 5 ảnh.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const remainingSlots = 5 - images.length;
      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      const urls = await Promise.all(
        filesToUpload.map(async (file) => {
          const base64 = await fileToBase64(file);
          const compressed = await compressImage(base64);
          return uploadImageToCloudinary(compressed);
        })
      );

      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch (err) {
      setError("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Vui lòng chọn lý do hoàn hàng.");
      return;
    }
    if (requireImage && images.length === 0) {
      setError("Vui lòng tải lên ít nhất một ảnh minh chứng.");
      return;
    }
    if (reasonText.length > 1000) {
      setError("Mô tả không được quá 1000 ký tự.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createReturnRequest({
        orderId,
        reason,
        reasonText: reasonText || undefined,
        images,
      });
      setSuccess(true);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gửi yêu cầu thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-bold text-green-800 mb-1">Yêu cầu hoàn hàng đã được gửi</h3>
        <p className="text-sm text-green-600">Chúng tôi sẽ xử lý trong 1-2 ngày làm việc. Bạn sẽ nhận được thông báo khi có cập nhật.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="font-bold uppercase tracking-tight mb-4">Yêu cầu hoàn hàng</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm mb-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Reason select */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Lý do hoàn hàng <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
          >
            <option value="">-- Chọn lý do --</option>
            {RETURN_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Reason text */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Mô tả chi tiết <span className="text-zinc-400 font-normal">(tùy chọn)</span>
          </label>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Mô tả thêm thông tin chi tiết về vấn đề của bạn..."
            rows={3}
            maxLength={1000}
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none"
          />
          <p className="text-xs text-zinc-400 mt-1 text-right">{reasonText.length}/1000</p>
        </div>

        {/* Image upload */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Ảnh minh chứng{" "}
            {requireImage && <span className="text-red-500">*</span>}
            <span className="text-zinc-400 font-normal ml-1">(tối đa 5 ảnh)</span>
          </label>

          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200">
                <Image
                  src={convertDriveLink(url)}
                  alt={`Ảnh ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-1 text-zinc-400 hover:border-brand-red hover:text-brand-red transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px] font-bold">Upload</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-400 max-w-xs">
            Sau khi gửi, yêu cầu sẽ được xử lý trong 1-2 ngày làm việc.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-red text-white px-6 py-3 font-label hover:bg-red-700 transition-colors disabled:opacity-50 rounded-xl text-sm"
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu hoàn hàng"}
          </button>
        </div>
      </div>
    </form>
  );
}
