/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      // Next.js defaults Server Action request bodies to 1MB, which silently
      // rejects memory/note/gallery submissions once a photo (especially an
      // uncompressed iPhone camera shot) is attached. Raised so multi-photo
      // uploads from phones go through the same as small test files on desktop.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
