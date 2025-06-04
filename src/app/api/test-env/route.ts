export async function GET() {
  return new Response(
    JSON.stringify({
      hasApiKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
} 