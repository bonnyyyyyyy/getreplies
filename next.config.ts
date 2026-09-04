import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse's Node worker file isn't reachable from any static import, so
  // Next's automatic dependency trace misses it — without this, the file is
  // absent from the deployed function bundle even though it works locally.
  // See lib/resumeParse.ts for the runtime side of this fix.
  outputFileTracingIncludes: {
    "/api/parse-resume": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
  },
};

export default nextConfig;
