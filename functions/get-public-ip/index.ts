import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  // Handle CORS for frontend calls
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Get the client's IP address from various headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');
    
    // Priority order: CF-Connecting-IP (Cloudflare) > X-Forwarded-For > X-Real-IP
    const clientIP = cfConnectingIP || 
                     (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
                     realIP || 
                     'unknown';

    // Additional IP information
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const country = req.headers.get('cf-ipcountry') || 'unknown';
    const timestamp = new Date().toISOString();

    const response = {
      success: true,
      data: {
        ip: clientIP,
        timestamp,
        userAgent,
        country,
        headers: {
          'x-forwarded-for': forwardedFor,
          'x-real-ip': realIP,
          'cf-connecting-ip': cfConnectingIP,
          'cf-ipcountry': country
        }
      }
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error getting public IP:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get public IP address',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});