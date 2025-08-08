// Shared CORS headers for all Supabase Edge Functions
// SECURITY: Only allow specific domains in production
const getAllowedOrigins = () => {
  const isDevelopment = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;
  
  if (isDevelopment) {
    // Development: Allow localhost and Expo development servers
    return [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8081',
      'exp://192.168.1.100:8081', // Example Expo dev server
      'https://localhost:19006', // Expo web
    ];
  }
  
  // Production: Only allow your production domains
  return [
    'https://tenesta.com',
    'https://www.tenesta.com',
    'https://app.tenesta.com',
    // Add your actual production domains here
  ];
};

export const corsHeaders = (origin?: string) => {
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  };
};