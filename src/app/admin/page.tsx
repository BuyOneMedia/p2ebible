'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  total_games: number;
  approved_games: number;
  pending_games: number;
  analyzed_games: number;
  active_links: number;
  total_clicks: number;
}

interface AgentRun {
  id: number;
  agent_name: string;
  status: string;
  games_found: number | null;
  games_analyzed: number | null;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

interface AffiliateLink {
  id: number;
  slug?: string;
  partner: string;
  partner_category: string;
  display_name: string;
  destination_url: string;
  affiliate_url: string;
  click_count: number;
  is_active: number;
  notes?: string;
  game_id?: number | null;
  created_at: string;
}

interface Game {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  website_url: string | null;
  chain: string | null;
  genre: string | null;
  status: string;
  source: string;
  source_url?: string | null;
  referral_url?: string | null;
  affiliate_notes?: string | null;
  is_featured: number;
  risk_level: string | null;
  risk_score: number | null;
  red_flags: string | null;
  green_flags: string | null;
  discovered_at: string;
}

type Tab = 'overview' | 'links' | 'review' | 'games';

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastMsg {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

let toastId = 0;

function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={`cursor-pointer rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            t.type === 'success'
              ? 'bg-[#00ff88] text-[#0a0a0f]'
              : t.type === 'error'
              ? 'bg-[#ff4444] text-white'
              : 'bg-[#1e1e2e] text-[#e2e2e2] border border-[#333355]'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ── Risk badge ────────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-xs text-[#555577]">Unanalyzed</span>;
  const map: Record<string, string> = {
    safe: 'bg-green-900/50 text-green-400 border-green-700/50',
    moderate: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',
    high_risk: 'bg-orange-900/50 text-orange-400 border-orange-700/50',
    scam: 'bg-red-900/50 text-red-400 border-red-700/50',
  };
  const labels: Record<string, string> = {
    safe: 'Safe',
    moderate: 'Moderate',
    high_risk: 'High Risk',
    scam: 'SCAM',
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[level] || 'bg-[#1e1e2e] text-[#888899] border-[#333355]'}`}
    >
      {labels[level] || level}
    </span>
  );
}

// ── Login gate ────────────────────────────────────────────────────────────────

function LoginGate({ onAuth }: { onAuth: (secret: string) => void }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!val.trim()) { setErr('Enter the admin secret.'); return; }
    localStorage.setItem('adminSecret', val.trim());
    onAuth(val.trim());
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] bg-[#0d0d18] p-8">
        <h1 className="mb-1 text-xl font-bold text-[#e2e2e2]">Admin Access</h1>
        <p className="mb-6 text-sm text-[#555577]">P2E Bible — internal dashboard</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="password"
            value={val}
            onChange={(e) => { setVal(e.target.value); setErr(''); }}
            placeholder="Admin secret"
            autoFocus
            className="rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-4 py-2.5 text-sm text-[#e2e2e2] placeholder-[#555577] outline-none focus:border-[#00ff88]/50"
          />
          {err && <p className="text-xs text-[#ff4444]">{err}</p>}
          <button
            type="submit"
            className="rounded-lg bg-[#00ff88] px-4 py-2.5 text-sm font-bold text-[#0a0a0f] transition-opacity hover:opacity-90"
          >
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({
  secret,
  toast,
}: {
  secret: string;
  toast: (type: ToastMsg['type'], text: string) => void;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  const headers = { 'x-admin-secret': secret };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agent-runs', { headers });
      const data = await res.json();
      setStats(data.stats);
      setRuns(data.runs || []);
    } catch {
      toast('error', 'Failed to load overview data.');
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => { load(); }, [load]);

  async function trigger(which: 'scout' | 'detective') {
    setTriggering(which);
    try {
      const res = await fetch(`/api/admin/trigger-${which}`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (data.ok) {
        toast('success', `${which === 'scout' ? 'Scout' : 'Detective'} triggered successfully.`);
        setTimeout(load, 2000);
      } else {
        toast('error', data.error || 'Trigger failed.');
      }
    } catch {
      toast('error', 'Network error triggering agent.');
    } finally {
      setTriggering(null);
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#555577]">Loading overview...</div>;
  }

  const statCards = stats
    ? [
        { label: 'Total Games', value: stats.total_games, color: 'text-[#e2e2e2]' },
        { label: 'Approved', value: stats.approved_games, color: 'text-[#00ff88]' },
        { label: 'Pending Review', value: stats.pending_games, color: 'text-yellow-400' },
        { label: 'Analyzed', value: stats.analyzed_games, color: 'text-blue-400' },
        { label: 'Active Links', value: stats.active_links, color: 'text-purple-400' },
        { label: 'Total Clicks', value: stats.total_clicks ?? 0, color: 'text-[#00ff88]' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#1e1e2e] bg-[#0d0d18] p-4 text-center"
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
            <div className="mt-1 text-xs text-[#555577]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trigger buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => trigger('scout')}
          disabled={triggering !== null}
          className="rounded-lg bg-[#00ff88] px-5 py-2.5 text-sm font-bold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {triggering === 'scout' ? 'Running Scout...' : 'Run Scout Now'}
        </button>
        <button
          onClick={() => trigger('detective')}
          disabled={triggering !== null}
          className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {triggering === 'detective' ? 'Running Detective...' : 'Run Detective Now'}
        </button>
        <button
          onClick={load}
          className="rounded-lg border border-[#1e1e2e] bg-[#0d0d18] px-5 py-2.5 text-sm text-[#888899] transition-colors hover:border-[#00ff88]/30 hover:text-[#e2e2e2]"
        >
          Refresh
        </button>
      </div>

      {/* Recent runs */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#888899]">Recent Agent Runs</h3>
        <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2e] text-left text-xs text-[#555577]">
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Found</th>
                <th className="px-4 py-3">Analyzed</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Finished</th>
                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 10).map((run) => (
                <tr key={run.id} className="border-b border-[#1e1e2e] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-[#8888aa]">{run.agent_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        run.status === 'success'
                          ? 'bg-green-900/40 text-green-400'
                          : run.status === 'running'
                          ? 'bg-blue-900/40 text-blue-400'
                          : 'bg-red-900/40 text-red-400'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#e2e2e2]">{run.games_found ?? '—'}</td>
                  <td className="px-4 py-3 text-[#e2e2e2]">{run.games_analyzed ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#555577]">
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#555577]">
                    {run.finished_at ? new Date(run.finished_at).toLocaleString() : '—'}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-xs text-[#ff4444]">
                    {run.error_message || ''}
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#555577]">
                    No agent runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Affiliate Links ──────────────────────────────────────────────────────

const EMPTY_LINK_FORM = {
  slug: '',
  partner: '',
  partner_category: '',
  display_name: '',
  destination_url: '',
  affiliate_url: '',
  notes: '',
};

function LinksTab({
  secret,
  toast,
}: {
  secret: string;
  toast: (type: ToastMsg['type'], text: string) => void;
}) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_LINK_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AffiliateLink>>({});
  const [saving, setSaving] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'x-admin-secret': secret };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/links', { headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      setLinks(data.links || []);
    } catch {
      toast('error', 'Failed to load affiliate links.');
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => { load(); }, [load]);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/links', {
        method: 'POST',
        headers,
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.ok) {
        toast('success', 'Link added.');
        setShowAddForm(false);
        setAddForm(EMPTY_LINK_FORM);
        load();
      } else {
        toast('error', data.error || 'Failed to add link.');
      }
    } catch {
      toast('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: number) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/links', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('success', 'Link updated.');
        setEditId(null);
        load();
      } else {
        toast('error', data.error || 'Failed to update.');
      }
    } catch {
      toast('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLink(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/links?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      });
      const data = await res.json();
      if (data.ok) {
        toast('success', 'Link deleted.');
        load();
      } else {
        toast('error', data.error || 'Failed to delete.');
      }
    } catch {
      toast('error', 'Network error.');
    }
  }

  async function toggleActive(link: AffiliateLink) {
    try {
      const res = await fetch('/api/admin/links', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: link.id, is_active: link.is_active ? 0 : 1 }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('info', `Link ${link.is_active ? 'deactivated' : 'activated'}.`);
        load();
      }
    } catch {
      toast('error', 'Network error.');
    }
  }

  function isPlaceholder(url: string) {
    return /YOUR_ID|PLACEHOLDER/i.test(url);
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#555577]">Loading links...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#555577]">{links.length} affiliate links</p>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-lg bg-[#00ff88] px-4 py-2 text-sm font-bold text-[#0a0a0f] transition-opacity hover:opacity-90"
        >
          {showAddForm ? 'Cancel' : 'Add New Link'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={addLink}
          className="rounded-xl border border-[#00ff88]/30 bg-[#0d0d18] p-5 space-y-3"
        >
          <h3 className="text-sm font-semibold text-[#00ff88]">New Affiliate Link</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['slug', 'Slug (optional)'],
              ['partner', 'Partner *'],
              ['partner_category', 'Category *'],
              ['display_name', 'Display Name *'],
              ['destination_url', 'Destination URL *'],
              ['affiliate_url', 'Affiliate URL *'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="mb-1 block text-xs text-[#555577]">{label}</label>
                <input
                  value={(addForm as Record<string, string>)[field] || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, [field]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-3 py-2 text-sm text-[#e2e2e2] placeholder-[#555577] outline-none focus:border-[#00ff88]/50"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#555577]">Notes</label>
            <textarea
              value={addForm.notes}
              onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-3 py-2 text-sm text-[#e2e2e2] placeholder-[#555577] outline-none focus:border-[#00ff88]/50"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00ff88] px-5 py-2 text-sm font-bold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Link'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e2e] text-left text-xs text-[#555577]">
              <th className="px-4 py-3">Display Name</th>
              <th className="px-4 py-3">Partner</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Affiliate URL</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) =>
              editId === link.id ? (
                <tr key={link.id} className="border-b border-[#1e1e2e] bg-[#0d0d18]">
                  <td className="px-4 py-3" colSpan={7}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {(
                        [
                          ['display_name', 'Display Name'],
                          ['partner', 'Partner'],
                          ['partner_category', 'Category'],
                          ['destination_url', 'Destination URL'],
                          ['affiliate_url', 'Affiliate URL'],
                        ] as [keyof AffiliateLink, string][]
                      ).map(([field, label]) => (
                        <div key={field}>
                          <label className="mb-0.5 block text-xs text-[#555577]">{label}</label>
                          <input
                            value={(editForm[field] as string) ?? ''}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, [field]: e.target.value }))
                            }
                            className="w-full rounded border border-[#1e1e2e] bg-[#0a0a0f] px-2 py-1.5 text-xs text-[#e2e2e2] outline-none focus:border-[#00ff88]/50"
                          />
                        </div>
                      ))}
                      <div className="flex items-end gap-2">
                        <button
                          onClick={() => saveEdit(link.id)}
                          disabled={saving}
                          className="rounded bg-[#00ff88] px-3 py-1.5 text-xs font-bold text-[#0a0a0f] hover:opacity-90 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="rounded border border-[#1e1e2e] px-3 py-1.5 text-xs text-[#888899] hover:text-[#e2e2e2]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={link.id} className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#0d0d18]/60">
                  <td className="px-4 py-3 font-medium text-[#e2e2e2]">{link.display_name}</td>
                  <td className="px-4 py-3 text-xs text-[#8888aa]">{link.partner}</td>
                  <td className="px-4 py-3 text-xs text-[#8888aa]">{link.partner_category}</td>
                  <td className="max-w-[200px] truncate px-4 py-3">
                    <span
                      className={`text-xs font-mono ${
                        isPlaceholder(link.affiliate_url)
                          ? 'text-orange-400 font-semibold'
                          : 'text-[#555577]'
                      }`}
                      title={link.affiliate_url}
                    >
                      {isPlaceholder(link.affiliate_url) && (
                        <span className="mr-1 text-orange-400">!</span>
                      )}
                      {link.affiliate_url.length > 40
                        ? link.affiliate_url.slice(0, 40) + '…'
                        : link.affiliate_url}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#e2e2e2]">
                    {link.click_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(link)}
                      className={`h-5 w-9 rounded-full transition-colors ${
                        link.is_active ? 'bg-[#00ff88]' : 'bg-[#333355]'
                      }`}
                    >
                      <span
                        className={`block h-4 w-4 translate-y-0 rounded-full bg-white shadow transition-transform ${
                          link.is_active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditId(link.id);
                          setEditForm({
                            display_name: link.display_name,
                            partner: link.partner,
                            partner_category: link.partner_category,
                            destination_url: link.destination_url,
                            affiliate_url: link.affiliate_url,
                          });
                        }}
                        className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-900/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLink(link.id, link.display_name)}
                        className="rounded px-2 py-1 text-xs text-[#ff4444] hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
            {links.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#555577]">
                  No affiliate links yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Game Review ──────────────────────────────────────────────────────────

function GameReviewTab({
  secret,
  toast,
  statusFilter,
}: {
  secret: string;
  toast: (type: ToastMsg['type'], text: string) => void;
  statusFilter: 'pending_review' | 'approved';
}) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const headers = { 'Content-Type': 'application/json', 'x-admin-secret': secret };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/games-review?status=${statusFilter}`, {
        headers: { 'x-admin-secret': secret },
      });
      const data = await res.json();
      setGames(data.games || []);
    } catch {
      toast('error', 'Failed to load games.');
    } finally {
      setLoading(false);
    }
  }, [secret, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function patchGame(id: number, body: object) {
    setActioning(id);
    try {
      const res = await fetch('/api/admin/games-review', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('success', 'Game updated.');
        load();
      } else {
        toast('error', data.error || 'Failed.');
      }
    } catch {
      toast('error', 'Network error.');
    } finally {
      setActioning(null);
    }
  }

  function copyReferral(id: number, url: string) {
    navigator.clipboard.writeText(url || '').then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#555577]">Loading games...</div>;
  }

  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-[#1e1e2e] bg-[#0d0d18] py-12 text-center text-sm text-[#555577]">
        No {statusFilter === 'pending_review' ? 'pending' : 'approved'} games.
      </div>
    );
  }

  if (statusFilter === 'approved') {
    return (
      <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e2e] text-left text-xs text-[#555577]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Chain</th>
              <th className="px-4 py-3">Genre</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Discovered</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#0d0d18]/60">
                <td className="px-4 py-3 font-medium text-[#e2e2e2]">{g.name}</td>
                <td className="px-4 py-3 text-xs text-[#8888aa]">{g.chain || '—'}</td>
                <td className="px-4 py-3 text-xs text-[#8888aa]">{g.genre || '—'}</td>
                <td className="px-4 py-3"><RiskBadge level={g.risk_level} /></td>
                <td className="px-4 py-3 text-xs text-[#555577]">{g.source}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => patchGame(g.id, { is_featured: g.is_featured ? 0 : 1 })}
                    disabled={actioning === g.id}
                    className={`text-sm ${g.is_featured ? 'text-yellow-400' : 'text-[#333355]'} hover:text-yellow-400`}
                    title="Toggle featured"
                  >
                    ★
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-[#555577]">
                  {new Date(g.discovered_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#555577]">{games.length} pending review</p>
        <button
          onClick={load}
          className="rounded-lg border border-[#1e1e2e] px-3 py-1.5 text-xs text-[#888899] hover:text-[#e2e2e2]"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {games.map((g) => (
          <div
            key={g.id}
            className="rounded-xl border border-[#1e1e2e] bg-[#0d0d18] p-5 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#e2e2e2]">{g.name}</h3>
                <p className="text-xs text-[#555577]">
                  {g.chain && <span className="mr-2">{g.chain}</span>}
                  {g.genre && <span>{g.genre}</span>}
                </p>
              </div>
              <RiskBadge level={g.risk_level} />
            </div>

            {/* Description */}
            {g.description && (
              <p className="text-xs text-[#888899] line-clamp-2">{g.description}</p>
            )}

            {/* Referral URL */}
            <div className="rounded-lg bg-[#0a0a0f] p-3">
              <p className="mb-1 text-xs font-semibold text-[#555577]">Referral URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-xs text-[#00ff88]">
                  {g.referral_url || '(none set)'}
                </code>
                {g.referral_url && (
                  <button
                    onClick={() => copyReferral(g.id, g.referral_url!)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-[#8888aa] hover:bg-[#1e1e2e] hover:text-[#e2e2e2]"
                  >
                    {copied === g.id ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            {/* Affiliate notes */}
            {g.affiliate_notes && (
              <p className="text-xs text-[#8888aa]">
                <span className="font-semibold text-[#555577]">Notes: </span>
                {g.affiliate_notes}
              </p>
            )}

            {/* Source */}
            <p className="text-xs text-[#555577]">
              Source: {g.source}
              {g.source_url && (
                <a
                  href={g.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-400 hover:underline"
                >
                  View source ↗
                </a>
              )}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1e1e2e]">
              <button
                onClick={() => patchGame(g.id, { status: 'approved' })}
                disabled={actioning === g.id}
                className="rounded-lg bg-[#00ff88] px-4 py-1.5 text-xs font-bold text-[#0a0a0f] hover:opacity-90 disabled:opacity-50"
              >
                {actioning === g.id ? '...' : 'Approve'}
              </button>
              <button
                onClick={() => patchGame(g.id, { status: 'rejected' })}
                disabled={actioning === g.id}
                className="rounded-lg bg-[#ff4444]/20 px-4 py-1.5 text-xs font-bold text-[#ff4444] hover:bg-[#ff4444]/30 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => patchGame(g.id, { is_featured: g.is_featured ? 0 : 1 })}
                disabled={actioning === g.id}
                className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-colors ${
                  g.is_featured
                    ? 'border-yellow-500/50 bg-yellow-900/20 text-yellow-400'
                    : 'border-[#1e1e2e] bg-[#0a0a0f] text-[#555577] hover:border-yellow-500/30 hover:text-yellow-400'
                }`}
              >
                {g.is_featured ? '★ Featured' : '☆ Feature'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('adminSecret');
    if (stored) setSecret(stored);
  }, []);

  function addToast(type: ToastMsg['type'], text: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function logout() {
    localStorage.removeItem('adminSecret');
    setSecret(null);
  }

  if (!secret) {
    return <LoginGate onAuth={setSecret} />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'links', label: 'Affiliate Links' },
    { id: 'review', label: 'Game Review' },
    { id: 'games', label: 'All Games' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#e2e2e2]">
              P2E Bible <span className="text-[#00ff88]">Admin</span>
            </h1>
            <p className="text-sm text-[#555577]">Internal dashboard — not publicly accessible</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-[#1e1e2e] px-4 py-2 text-xs text-[#888899] transition-colors hover:border-[#ff4444]/30 hover:text-[#ff4444]"
          >
            Logout
          </button>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl border border-[#1e1e2e] bg-[#0d0d18] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-[#00ff88] text-[#0a0a0f]'
                  : 'text-[#888899] hover:text-[#e2e2e2]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {tab === 'overview' && <OverviewTab secret={secret} toast={addToast} />}
          {tab === 'links' && <LinksTab secret={secret} toast={addToast} />}
          {tab === 'review' && (
            <GameReviewTab secret={secret} toast={addToast} statusFilter="pending_review" />
          )}
          {tab === 'games' && (
            <GameReviewTab secret={secret} toast={addToast} statusFilter="approved" />
          )}
        </div>
      </div>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
