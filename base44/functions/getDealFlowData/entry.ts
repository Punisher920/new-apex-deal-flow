import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiUrl = Deno.env.get("DEAL_FLOW_API_URL");
    if (!apiUrl) {
      return Response.json({ error: 'DEAL_FLOW_API_URL not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint = '/deals', search = '', filters = {} } = body;

    const url = new URL(endpoint, apiUrl);
    if (search) url.searchParams.set('q', search);
    Object.entries(filters).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });

    const response = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return Response.json({ error: `API error: ${response.status}`, fallback: true }, { status: 200 });
    }

    const data = await response.json();
    return Response.json({ data, fallback: false });
  } catch (error) {
    return Response.json({ error: error.message, fallback: true }, { status: 200 });
  }
});