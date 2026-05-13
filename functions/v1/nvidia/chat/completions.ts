export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = "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";
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";

  // Forward the request to NVIDIA
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: await request.text(),
  });

  // Return the NVIDIA response back to the client
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
