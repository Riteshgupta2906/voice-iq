/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).protocol.replace(":", ""),
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
          }
        ]
      : []
  }
};

export default nextConfig;
