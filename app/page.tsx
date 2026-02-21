"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

type Metrics = {
  fullName: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  commitFrequency: { week: string; commits: number }[];
  issueFlow: { week: string; opened: number; closed: number }[];
};

export default function Home() {
  const [repo, setRepo] = useState("vercel/next.js");
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (target = repo) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/metrics?repo=${encodeURIComponent(target)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch metrics");
      setData(json);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("vercel/next.js");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <h1>DevPulse</h1>
      <p className="helper">Quickly evaluate delivery consistency and issue flow for any public GitHub repo.</p>

      <div className="form">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repo or https://github.com/owner/repo"
        />
        <button onClick={() => load()} disabled={loading}>{loading ? "Loading..." : "Analyze repo"}</button>
      </div>

      {error && <p style={{ color: "#ff9aa3" }}>{error}</p>}

      {data && (
        <>
          <section className="grid">
            <div className="card"><div className="label">Repository</div><div className="metric" style={{ fontSize: "1rem" }}>{data.fullName}</div></div>
            <div className="card"><div className="label">Stars</div><div className="metric">{data.stars}</div></div>
            <div className="card"><div className="label">Forks</div><div className="metric">{data.forks}</div></div>
            <div className="card"><div className="label">Open Issues</div><div className="metric">{data.openIssues}</div></div>
            <div className="card"><div className="label">Watchers</div><div className="metric">{data.watchers}</div></div>
          </section>

          <section className="chart-card">
            <h2>Weekly Commit Frequency (last 12 buckets)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.commitFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3761" />
                <XAxis dataKey="week" stroke="#95a4d4" />
                <YAxis stroke="#95a4d4" />
                <Tooltip />
                <Line type="monotone" dataKey="commits" stroke="#7ce2ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2>Issue Flow (opened vs closed)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.issueFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3761" />
                <XAxis dataKey="week" stroke="#95a4d4" />
                <YAxis stroke="#95a4d4" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opened" stroke="#ffc86f" strokeWidth={2} />
                <Line type="monotone" dataKey="closed" stroke="#86efac" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </main>
  );
}
