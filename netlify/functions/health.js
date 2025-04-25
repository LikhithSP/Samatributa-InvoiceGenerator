
export async function handler(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'ok', message: 'API is running' }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
}