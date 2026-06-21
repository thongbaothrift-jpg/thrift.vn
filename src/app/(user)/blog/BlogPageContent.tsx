"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { BlogPost } from "@/lib/api/blog";
import { useSiteTexts } from "@/lib/site-texts-context";
import { convertDriveLink } from "@/lib/utils";

interface BlogPageContentProps {
  initialPosts: BlogPost[];
  filteredPosts: BlogPost[];
  currentCategory: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  "Tất cả": "Tất cả",
  "FASHION": "Fashion",
  "AUTHENTIC_GUIDE": "Hướng dẫn xác thực",
  "NEWS": "Tin tức",
  "LIFESTYLE": "Lifestyle"
};

export function BlogPageContent({ initialPosts, filteredPosts, currentCategory }: BlogPageContentProps) {
  const router = useRouter();
  const { get } = useSiteTexts();
  const [isPending, startTransition] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);

  // Sync state when props change (URL navigation)
  useEffect(() => {
    setSelectedCategory(currentCategory);
  }, [currentCategory]);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [filteredPosts]);

  // Get unique categories from all posts
  const uniqueCategories = Array.from(new Set(initialPosts.map((p) => p.category)));
  const categories = ["Tất cả", ...uniqueCategories];

  const handleCategoryChange = (cat: string) => {
    if (cat === selectedCategory) return;
    
    setSelectedCategory(cat); // Optimistic UI update
    startTransition(() => {
      router.push(`/blog${cat === "Tất cả" ? "" : `?category=${cat}`}`, { scroll: false });
    });
  };

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 reveal">
          {get('blog.title', 'Blog')}
        </h1>
        <p className="text-xl text-zinc-500 leading-relaxed reveal">
          {get('blog.subtitle', 'Tin tức, hướng dẫn và thông tin về thời trang xa xỉ, xác thực và mua sắm bền vững.')}
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2 mb-16 reveal">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
              selectedCategory === cat
                ? "bg-black text-white"
                : "border border-zinc-200 text-zinc-500 hover:border-black hover:text-black"
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div className={`transition-all duration-500 ${isPending ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
        {/* Featured Post */}
        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`} className="block mb-24 group reveal">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
              <div className="lg:col-span-7 overflow-hidden relative aspect-[16/9] bg-zinc-100">
                <Image
                  src={convertDriveLink(featuredPost.coverImage)}
                  alt={featuredPost.title}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="lg:col-span-5 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-brand-red tracking-[0.2em] uppercase mb-4">
                  {CATEGORY_LABELS[featuredPost.category] || featuredPost.category}
                </span>
                <h2 className="text-3xl md:text-5xl font-black mb-6 group-hover:text-brand-red transition-colors leading-tight uppercase tracking-tighter">
                  {featuredPost.title}
                </h2>
                <p className="text-zinc-500 mb-8 line-clamp-3 text-sm leading-relaxed italic">
                  "{featuredPost.excerpt}"
                </p>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <span>{featuredPost.author.firstName} {featuredPost.author.lastName}</span>
                  <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                  <span>{featuredPost.readTime} Phút đọc</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {otherPosts.map((post, idx) => (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`} 
              className="group reveal"
            >
              <div className="overflow-hidden mb-6 relative aspect-[4/3] bg-zinc-100">
                <Image
                  src={convertDriveLink(post.coverImage)}
                  alt={post.title}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] font-bold text-brand-red tracking-widest uppercase mb-3 block">
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
              <h3 className="text-xl font-black mt-2 mb-3 group-hover:text-brand-red transition-colors line-clamp-2 uppercase tracking-tighter">
                {post.title}
              </h3>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-zinc-400 pt-4 border-t border-zinc-100">
                <span>{post.author.firstName} {post.author.lastName}</span>
                <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                <span>{post.readTime} Phút đọc</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
