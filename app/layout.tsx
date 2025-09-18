import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import { ToastProvider } from "@/components/ToastProvider";
import CosmicBadge from "@/components/CosmicBadge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Email Marketing Workflow",
  description: "Manage your email marketing campaigns with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bucketSlug = process.env.COSMIC_BUCKET_SLUG as string;

  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <Layout>
            {children}
          </Layout>
          <CosmicBadge bucketSlug={bucketSlug} />
        </ToastProvider>
      </body>
    </html>
  );
}