import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");
    const body = await req.json().catch(() => ({}));
    const { repo } = body; // e.g. "owner/repo-name"

    if (!repo) {
      return Response.json({ error: 'repo parameter required (e.g. "owner/repo-name")' }, { status: 400 });
    }

    // List contents of the agents/ directory
    const contentsRes = await fetch(`https://api.github.com/repos/${repo}/contents/agents`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DealFinder-App'
      }
    });

    if (!contentsRes.ok) {
      return Response.json({ error: `GitHub API error: ${contentsRes.status}`, agents: [] });
    }

    const files = await contentsRes.json();
    const jsonFiles = Array.isArray(files) ? files.filter(f => f.name.endsWith('.json')) : [];

    // Fetch each agent file in parallel
    const agentPromises = jsonFiles.map(async (file) => {
      const fileRes = await fetch(file.download_url, {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'DealFinder-App' }
      });
      if (!fileRes.ok) return null;
      const config = await fileRes.json();
      return {
        name: file.name.replace('.json', ''),
        file: file.name,
        sha: file.sha,
        ...config
      };
    });

    const agents = (await Promise.all(agentPromises)).filter(Boolean);
    return Response.json({ agents });
  } catch (error) {
    return Response.json({ error: error.message, agents: [] }, { status: 500 });
  }
});