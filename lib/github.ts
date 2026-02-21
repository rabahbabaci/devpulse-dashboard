export type RepoMetrics = {
  fullName: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  commitFrequency: { week: string; commits: number }[];
  issueFlow: { week: string; opened: number; closed: number }[];
};

type WeekBucket = { key: string; label: string };

const API = "https://api.github.com";

type GitHubIssue = {
  pull_request?: { url: string };
  created_at: string;
  closed_at: string | null;
};

function headers() {
  const token = process.env.GITHUB_TOKEN;
  return {
    "User-Agent": "devpulse-dashboard",
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function weekStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - date.getUTCDay()));
}

function bucketForDate(date: Date): WeekBucket {
  const ws = weekStart(date);
  const key = ws.toISOString().slice(0, 10); // YYYY-MM-DD for stable sorting
  const label = `${ws.getUTCMonth() + 1}/${ws.getUTCDate()}`;
  return { key, label };
}

export async function getRepoMetrics(owner: string, repo: string): Promise<RepoMetrics> {
  const [repoData, commits, issues] = await Promise.all([
    fetchJson(`${API}/repos/${owner}/${repo}`),
    fetchJson(`${API}/repos/${owner}/${repo}/commits?per_page=100`),
    fetchJson(`${API}/repos/${owner}/${repo}/issues?state=all&per_page=100`)
  ]);

  const commitBuckets = new Map<string, { label: string; commits: number }>();
  for (const c of commits) {
    const d = new Date(c.commit.author.date);
    const bucket = bucketForDate(d);
    const prev = commitBuckets.get(bucket.key) || { label: bucket.label, commits: 0 };
    prev.commits += 1;
    commitBuckets.set(bucket.key, prev);
  }

  const issueBuckets = new Map<string, { label: string; opened: number; closed: number }>();
  for (const i of (issues as GitHubIssue[]).filter((x) => !x.pull_request)) {
    const created = new Date(i.created_at);
    const createdBucket = bucketForDate(created);
    const c = issueBuckets.get(createdBucket.key) || { label: createdBucket.label, opened: 0, closed: 0 };
    c.opened += 1;
    issueBuckets.set(createdBucket.key, c);

    if (i.closed_at) {
      const closed = new Date(i.closed_at);
      const closedBucket = bucketForDate(closed);
      const cc = issueBuckets.get(closedBucket.key) || { label: closedBucket.label, opened: 0, closed: 0 };
      cc.closed += 1;
      issueBuckets.set(closedBucket.key, cc);
    }
  }

  const commitFrequency = [...commitBuckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([, v]) => ({ week: v.label, commits: v.commits }));

  const issueFlow = [...issueBuckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([, v]) => ({ week: v.label, opened: v.opened, closed: v.closed }));

  return {
    fullName: repoData.full_name,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    watchers: repoData.subscribers_count,
    commitFrequency,
    issueFlow
  };
}
