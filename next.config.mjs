let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Firebase istemci taraflı kullanımını desteklemek için Webpack yapılandırması
  webpack: (config, { isServer }) => {
    // İstemci tarafı derlemelerinde bu modülleri çalışmasına izin ver
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
    }
    
    // Tüm Firebase modüllerini istemci taraflı olarak işaretle
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    config.module.rules.push({
      test: /firebase\/.*/,
      sideEffects: false,
      use: ['client-only']
    });
    
    return config;
  },
  // Firebase ve diğer istemci taraflı modüllerin sunucu bileşenlerinde yüklenmeye çalışıldığında transpile edilmesini sağla
  transpilePackages: [
    'firebase', 
    'firebase/app', 
    'firebase/firestore', 
    'firebase/auth', 
    'firebase/storage', 
    'firebase/database',
    '@firebase/app',
    '@firebase/app-compat',
    '@firebase/auth',
    '@firebase/auth-compat',
    '@firebase/database',
    '@firebase/database-compat',
    '@firebase/firestore',
    '@firebase/firestore-compat',
    '@firebase/functions',
    '@firebase/functions-compat',
    '@firebase/storage',
    '@firebase/storage-compat'
  ],
  // Kritik hatanın ele alınması için eklenen ayarlar
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverComponentsExternalPackages: ['firebase', '@firebase/app']
  },
}

if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      }
    } else {
      nextConfig[key] = config[key]
    }
  }
}

export default nextConfig
