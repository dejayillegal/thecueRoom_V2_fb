/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-switch'],
  },
  
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [import.meta.url],
        },
      };
      
      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
        immutablePaths: [],
      };
      
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: isServer ? undefined : 'single',
        splitChunks: isServer
          ? false
          : {
              chunks: 'all',
              cacheGroups: {
                default: false,
                vendors: false,
                commons: {
                  name: 'commons',
                  chunks: 'all',
                  minChunks: 2,
                },
                lib: {
                  test: /[\\/]node_modules[\\/]/,
                  name(module) {
                    const packageName = module.context.match(
                      /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                    )?.[1];
                    return `npm.${packageName?.replace('@', '')}`;
                  },
                },
              },
            },
      };
    }
    
    return config;
  },
  
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.6amgroup.com" },
      { protocol: "https", hostname: "**.bandcamp.com" },
      { protocol: "https", hostname: "**.bing.com" },
      { protocol: "https", hostname: "**.climg.net" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.clubberia.com" },
      { protocol: "https", hostname: "**.complex.com" },
      { protocol: "https", hostname: "**.consequence.net" },
      { protocol: "https", hostname: "**.ctfassets.net" },
      { protocol: "https", hostname: "**.djmag.com" },
      { protocol: "https", hostname: "**.earmilk.com" },
      { protocol: "https", hostname: "**.edm.com" },
      { protocol: "https", hostname: "**.edmsauce.com" },
      { protocol: "https", hostname: "**.factmag.com" },
      { protocol: "https", hostname: "**.fader.com" },
      { protocol: "https", hostname: "**.google.com" },
      { protocol: "https", hostname: "**.highonscore.com" },
      { protocol: "https", hostname: "**.hypebot.com" },
      { protocol: "https", hostname: "**.hypem.com" },
      { protocol: "https", hostname: "**.image-line.com" },
      { protocol: "https", hostname: "**.kvraudio.com" },
      { protocol: "https", hostname: "**.mixmag.net" },
      { protocol: "https", hostname: "**.musicbusinessworldwide.com" },
      { protocol: "https", hostname: "**.musicplus.in" },
      { protocol: "https", hostname: "**.musicradar.com" },
      { protocol: "https", hostname: "**.musictech.com" },
      { protocol: "https", hostname: "**.neonmusic.co.uk" },
      { protocol: "https", hostname: "**.popjustice.com" },
      { protocol: "https", hostname: "**.ra.co" },
      { protocol: "https", hostname: "**.redd.it" },
      { protocol: "https", hostname: "**.rollingstone.com" },
      { protocol: "https" , hostname:"**.rollingstoneindia.com" },
      { protocol: "https", hostname: "**.spin.com" },
      { protocol: "https", hostname: "**.stereofox.com" },
      { protocol: "https", hostname: "**.thefader.com" },
      { protocol: "https", hostname: "**.theindianmusicdiaries.com" },
      { protocol: "https", hostname: "**.theplayground.co.uk" },
      { protocol: "https", hostname: "**.theransomnote.com" },
      { protocol: "https", hostname: "**.thissongissick.com" },
      { protocol: "https", hostname: "**.ufo-network.com" },
      { protocol: "https", hostname: "**.undertheradarmag.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "**.xlr8r.com" },
      { protocol: "https", hostname: "**.youredm.com" },
      { protocol: "https", hostname: "cdm.link" },
      { protocol: "https", hostname: "bedroomproducersblog.com" },
      { protocol: "https", hostname: "blog.arturia.com" },
      { protocol: "https", hostname: "blog.native-instruments.com" },
      { protocol: "https", hostname: "www.bordermovement.com" },
    ],
  },
};
export default nextConfig;
