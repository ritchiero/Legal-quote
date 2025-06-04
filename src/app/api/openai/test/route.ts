export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  return new Response(
    JSON.stringify({
      configured: !!apiKey,
      keyInfo: apiKey ? {
        length: apiKey.length,
        startsWith: apiKey.substring(0, 3),
        endsWith: apiKey.substring(apiKey.length - 3)
      } : null,
      environment: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env)
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
} 