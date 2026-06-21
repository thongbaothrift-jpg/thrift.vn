"use client";

import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
        <p className="text-zinc-500">Thank you for reaching out. We will get back to you within 24 hours.</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="mt-6 text-sm underline hover:no-underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors"
          placeholder="your.email@example.com"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
        <select
          id="subject"
          required
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none bg-white transition-colors"
        >
          <option value="">Select a topic</option>
          <option value="authentication">Authentication</option>
          <option value="buying">Buying</option>
          <option value="selling">Selling / Consignment</option>
          <option value="order">Order Status</option>
          <option value="returns">Returns / Exchange</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
        <textarea
          id="message"
          required
          rows={6}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full border border-zinc-300 px-5 py-3 focus:border-black focus:outline-none transition-colors resize-none"
          placeholder="How can we help you?"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white py-4 font-medium hover:bg-zinc-800 transition-colors"
      >
        Send Message
      </button>
    </form>
  );
}
