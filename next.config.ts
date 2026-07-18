import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // Certificados de Inscripción del R.V.M. escaneados: fácilmente superan
      // el límite por defecto de 1MB, sobre todo al subir varios juntos.
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
