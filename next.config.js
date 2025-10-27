
/** @type {import('next').NextConfig} */

process.env.TZ = 'Etc/UTC';

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.bandcamp.com" },
      { protocol: "https", hostname: "**.bcbits.com" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.scdn.co" },
      { protocol: "https", hostname: "*.com" },
      { protocol: "https", hostname: "*.net" },
      { protocol: "https", hostname: "*.org" },
      { protocol: "https", hostname: "*.se" },
      { protocol: "https", hostname: "*.co.uk" },
      { protocol: "https", hostname: "images.ctfassets.net" },
      { protocol: "https", hostname: "i.redd.it" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "external-preview.redd.it" },
      { protocol: "https", hostname: "cdm.link" },
      { protocol: "https", hostname: "theindianmusicdiaries.com" },
    ],
  },
   webpack: (config) => {
    config.externals.push(
      '@opentelemetry/api',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node'
    );
    return config;
  },
};
module.exports = nextConfig;
