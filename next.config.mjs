/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "loftlounge.ro" },
      { protocol: "https", hostname: "kuziini.ro" },
    ],
  },
};

export default nextConfig;
