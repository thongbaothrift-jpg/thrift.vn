import { Suspense } from "react";
import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";
import { getBlogPosts } from "@/lib/api/blog";
import { BlogPageContent } from "./BlogPageContent";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("blog");
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = (params.category as string) || "Tất cả";

  const posts = await getBlogPosts();

  const filteredPosts = category === "Tất cả"
    ? posts
    : posts.filter((p) => p.category === category);

  return (
    <Suspense fallback={<div className="min-h-screen p-12"><div className="h-20 w-64 shimmer mb-12" /></div>}>
      <BlogPageContent
        initialPosts={posts}
        currentCategory={category}
        filteredPosts={filteredPosts}
      />
    </Suspense>
  );
}
