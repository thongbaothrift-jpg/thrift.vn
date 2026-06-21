"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BlogPostSkeleton } from "@/components/Skeleton";
import type { BlogPost } from "@/lib/api/blog";
import { convertDriveLink } from "@/lib/utils";

interface BlogPostContentProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export function BlogPostContent({ post, relatedPosts }: BlogPostContentProps) {
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
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return <BlogPostSkeleton />;
  }

  return (
    <article className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8 reveal">
        <Link href="/" className="hover:text-black transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-black transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-black truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-12 reveal">
        <span className="text-xs font-medium text-brand-red tracking-wider uppercase">
          {post.category}
        </span>
        <h1 className="text-4xl md:text-5xl font-black mt-3 mb-6 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-6 text-sm text-zinc-500 pb-8 border-b border-zinc-200">
          <span>{post.author.firstName} {post.author.lastName}</span>
          <span>•</span>
          <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric"
            }) : ''}
          </time>
          <span>•</span>
          <span>{post.readTime} phút đọc</span>
        </div>
      </header>

      {/* Featured Image */}
      <div className="mb-12 -mx-4 md:-mx-8 reveal">
        <div className="relative w-full aspect-[16/9] bg-zinc-100">
          <Image
            src={convertDriveLink(post.coverImage)}
            alt={post.title}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Content */}
      <div 
        className="prose prose-lg max-w-none mb-16 reveal"
        dangerouslySetInnerHTML={{ 
          __html: post.content
            // 1. Google Drive full resolution
            .replace(
              /(https:\/\/lh3\.googleusercontent\.com\/d\/[a-zA-Z0-9_-]+)/g,
              '$1=s0'
            )
            // 2. Safely extract and rebuild img tags
            .replace(/<img([^>]*)>/gi, (match, attrs) => {
              let src = '';
              // Match src and data-src allowing spaces around =
              const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
              const dataSrcMatch = attrs.match(/data-src\s*=\s*["']([^"']+)["']/i);
              
              if (dataSrcMatch && dataSrcMatch[1] && !dataSrcMatch[1].startsWith('data:image')) {
                src = dataSrcMatch[1];
              } else if (srcMatch && srcMatch[1]) {
                src = srcMatch[1];
              } else {
                // Try to catch unquoted src just in case
                const unquotedSrcMatch = attrs.match(/src\s*=\s*([^\s>]+)/i);
                if (unquotedSrcMatch && unquotedSrcMatch[1]) {
                  src = unquotedSrcMatch[1];
                }
              }
              
              if (!src) return match; // If we can't parse it, leave it alone to avoid blank spaces
              
              // Strip WordPress thumbnail suffix (-600x900.jpg -> .jpg) only if it exists
              src = src.replace(/m?-\d+x\d+(\.[a-zA-Z]+)$/i, '$1');
              
              return `<img src="${src}" alt="Article image" class="w-full h-auto rounded-xl shadow-md my-8" />`;
            })
            // 3. Clean up WordPress gallery styles
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        }}
      />

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-16 pt-8 border-t border-zinc-200 reveal">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="px-4 py-2 bg-zinc-100 text-sm text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Share */}
      <div className="flex items-center gap-4 mb-16 pb-8 border-b border-zinc-200 reveal">
        <span className="font-medium">Chia sẻ:</span>
        <div className="flex gap-3">
          {["Facebook", "Twitter", "Sao chép link"].map((platform) => (
            <button
              key={platform}
              className="px-4 py-2 border border-zinc-300 text-sm hover:bg-black hover:text-white hover:border-black transition-colors"
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 reveal">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost, idx) => (
              <Link 
                key={relatedPost.id} 
                href={`/blog/${relatedPost.slug}`} 
                className="group reveal"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="overflow-hidden mb-4 relative aspect-[4/3] bg-zinc-100">
                  <Image
                    src={convertDriveLink(relatedPost.coverImage)}
                    alt={relatedPost.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs font-medium text-brand-red tracking-wider uppercase">
                  {relatedPost.category}
                </span>
                <h3 className="text-base font-bold mt-2 group-hover:text-brand-red transition-colors line-clamp-2">
                  {relatedPost.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to Blog */}
      <div className="text-center reveal">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-brand-red transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Quay lại Blog
        </Link>
      </div>
    </article>
  );
}
