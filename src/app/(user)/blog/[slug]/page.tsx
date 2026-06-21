import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, getRelatedPosts } from "@/lib/api/blog";
import { BlogPostContent } from "./BlogPostContent";
import { createBlogMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Bài viết không tìm thấy | Thrifted",
    };
  }

  return createBlogMetadata({
    title: post.title,
    description: post.excerpt,
    slug,
    publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    modifiedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    author: `${post.author.firstName} ${post.author.lastName}`,
    image: post.coverImage,
  });
}

function ArticleJsonLd({ post }: { post: NonNullable<Awaited<ReturnType<typeof getBlogPostBySlug>>> }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
      url: "https://thrift.vn/about",
    },
    publisher: {
      "@type": "Organization",
      name: "Thrifted",
      logo: {
        "@type": "ImageObject",
        url: "https://thrift.vn/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://thrift.vn/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    wordCount: post.content.split(" ").length,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(slug, post.category);

  return (
    <>
      <ArticleJsonLd post={post} />
      <BlogPostContent post={post} relatedPosts={relatedPosts} />
    </>
  );
}
