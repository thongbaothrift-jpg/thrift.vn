"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ContactPageSkeleton } from "@/components/Skeleton";
import { useSiteTexts } from "@/lib/site-texts-context";

export function ContactPageContent() {
  const { get, isLoading: textsLoading } = useSiteTexts();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll reveal
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [loading]);

  // Read from site-texts
  const address = get("contact.address");
  const email = get("contact.email");
  const phone = get("contact.phone");
  const hotline = get("contact.hotline");
  const workingHours = get("contact.working_hours");
  const facebookUrl = get("social.facebook");
  const instagramUrl = get("social.instagram");
  const tiktokUrl = get("social.tiktok");

  if (loading || textsLoading) {
    return <ContactPageSkeleton />;
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-6 reveal">
          Liên hệ
        </h1>
        <p className="text-xl text-zinc-500 leading-relaxed reveal">
          Chúng tôi sẵn sàng hỗ trợ. Liên hệ để được giải đáp về xác thực, mua
          bán, hoặc ký gửi.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 reveal">
        {/* Contact Info */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Liên hệ với chúng tôi</h2>

          <div className="space-y-8">
            {/* Address */}
            {address && (
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-600"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Địa chỉ</h3>
                  <p className="text-zinc-500 whitespace-pre-line">{address}</p>
                </div>
              </div>
            )}

            {/* Email */}
            {email && (
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-600"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Email</h3>
                  <a
                    href={`mailto:${email}`}
                    className="text-zinc-500 hover:text-black transition-colors"
                  >
                    {email}
                  </a>
                </div>
              </div>
            )}

            {/* Phone / Hotline */}
            {(phone || hotline) && (
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-600"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">
                    {hotline ? "Hotline" : "Điện thoại"}
                  </h3>
                  {hotline && (
                    <a
                      href={`tel:${hotline}`}
                      className="text-zinc-500 hover:text-black transition-colors block"
                    >
                      {hotline}
                    </a>
                  )}
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="text-zinc-500 hover:text-black transition-colors block"
                    >
                      {phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Working Hours */}
            {workingHours && (
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Giờ làm việc</h3>
                  <p className="text-zinc-500 whitespace-pre-line">
                    {workingHours}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {(facebookUrl || instagramUrl || tiktokUrl) && (
            <div className="mt-12 pt-8 border-t border-zinc-200">
              <h3 className="font-bold mb-4">Theo dõi chúng tôi</h3>
              <div className="flex gap-4">
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 border border-zinc-300 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors"
                    aria-label="Facebook"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 border border-zinc-300 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors"
                    aria-label="Instagram"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 border border-zinc-300 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors"
                    aria-label="TikTok"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-bold mb-8">
            Gửi tin nhắn cho chúng tôi
          </h2>
          <ContactForm />
        </div>
      </div>

      {/* Map */}
      {address && (
        <div className="mt-16 reveal">
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d250604.92737796308!2d106.60393394999999!3d10.771269499999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3a8d2c6db3%3A0x5b2e4a7e4b5b5b5b!2sHo%20Chi%20Minh%20City%2C%20Vietnam!5e0!3m2!1sen!2s!4v1715000000000!5m2!1sen!2s`}
            width="100%"
            height="320"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-80 grayscale contrast-100 rounded-none"
            title={`Vị trí ${get("brand.shop_name") || "THRIFT.VN"} trên bản đồ`}
          />
        </div>
      )}
    </div>
  );
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Gửi thất bại");
      setIsSubmitted(true);
    } catch {
      setSubmitError("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-green-600"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Đã gửi tin nhắn!</h3>
        <p className="text-zinc-500">
          Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong 24 giờ.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="mt-6 text-sm underline hover:no-underline"
        >
          Gửi tin nhắn khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Họ và tên
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors"
          placeholder="Tên của bạn"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Chủ đề
        </label>
        <select
          id="subject"
          required
          value={formData.subject}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none bg-white transition-colors"
        >
          <option value="">Chọn chủ đề</option>
          <option value="authentication">Xác thực</option>
          <option value="buying">Mua hàng</option>
          <option value="selling">Bán hàng / Ký gửi</option>
          <option value="order">Tình trạng đơn hàng</option>
          <option value="returns">Đổi trả</option>
          <option value="other">Khác</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Nội dung
        </label>
        <textarea
          id="message"
          required
          rows={6}
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors resize-none"
          placeholder="Chúng tôi có thể giúp gì cho bạn?"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-white py-4 font-medium hover:bg-zinc-800 transition-colors disabled:opacity-60"
      >
        {isSubmitting ? "Đang gửi..." : "Gửi tin nhắn"}
      </button>
      {submitError && (
        <p className="text-red-500 text-sm font-medium">{submitError}</p>
      )}
    </form>
  );
}
