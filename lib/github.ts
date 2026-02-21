export type RepoMetrics = {
  fullName: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  commitFrequency: { week: string; commits: number }[];
  issueFlow: { week: string; opened: number; closed: number }[];
};

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

function fmtWeek(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export async function getRepoMetrics(owner: string, repo: string): Promise<RepoMetrics> {
  const [repoData, commits, issues] = await Promise.all([
    fetchJson(`${API}/repos/${owner}/${repo}`),
    fetchJson(`${API}/repos/${owner}/${repo}/commits?per_page=100`),
    fetchJson(`${API}/repos/${owner}/${repo}/issues?state=all&per_page=100`)
  ]);

  const commitBuckets = new Map<string, number>();
  for (const c of commits) {
    const d = new Date(c.commit.author.date);
    const week = fmtWeek(new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()));
    commitBuckets.set(week, (commitBuckets.get(week) || 0) + 1);
  }

  const issueBuckets = new Map<string, { opened: number; closed: number }>();
  for (const i of (issues as GitHubIssue[]).filter((x) => !x.pull_request)) {
    const created = new Date(i.created_at);
    const cw = fmtWeek(new Date(created.getFullYear(), created.getMonth(), created.getDate() - created.getDay()));
    const c = issueBuckets.get(cw) || { opened: 0, closed: 0 };
    c.opened += 1;
    issueBuckets.set(cw, c);

    if (i.closed_at) {
      const closed = new Date(i.closed_at);
      const clw = fmtWeek(new Date(closed.getFullYear(), closed.getMonth(), closed.getDate() - closed.getDay()));
      const cc = issueBuckets.get(clw) || { opened: 0, closed: 0 };
      cc.closed += 1;
      issueBuckets.set(clw, cc);
    }
  }

  const commitFrequency = [...commitBuckets.entries()]
    .map(([week, commits]) => ({ week, commits }))
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
    .slice(-12);

  const issueFlow = [...issueBuckets.entries()]
    .map(([week, v]) => ({ week, opened: v.opened, closed: v.closed }))
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
    .slice(-12);

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
