import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api';

function formatWhen(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

function providerLabel(provider) {
  if (provider === 'google') return 'Google';
  return 'Password';
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (filter === 'blocked' && !user.isBlocked) return false;
      if (filter === 'active' && user.isBlocked) return false;
      if (!q) return true;
      return (
        user.email?.toLowerCase().includes(q) ||
        user.name?.toLowerCase().includes(q)
      );
    });
  }, [users, search, filter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => !user.isBlocked).length,
      blocked: users.filter((user) => user.isBlocked).length,
      admins: users.filter((user) => user.isAdmin).length,
    }),
    [users]
  );

  const toggleBlocked = async (user, blocked) => {
    setBusyId(user.id);
    setMessage('');
    setError('');
    try {
      const updated = await api.setUserBlocked(user.id, blocked);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(
        blocked
          ? `${updated.email} has been blocked`
          : `${updated.email} has been unblocked`
      );
    } catch (err) {
      setError(err.message || 'Could not update user');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">User management</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            See who has signed in and block or unblock access. Admin accounts cannot be blocked.
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total users', value: stats.total, icon: Users },
          { label: 'Active', value: stats.active, icon: CheckCircle2 },
          { label: 'Blocked', value: stats.blocked, icon: Ban },
          { label: 'Admins', value: stats.admins, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="glass-panel rounded-3xl p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'blocked', label: 'Blocked' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  filter === item.key
                    ? 'bg-ink text-paper'
                    : 'border border-line text-muted hover:bg-paper-2 hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-14 rounded-2xl" />
            <div className="skeleton h-14 rounded-2xl" />
            <div className="skeleton h-14 rounded-2xl" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            No users match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-3 font-semibold">User</th>
                  <th className="px-3 py-3 font-semibold">Sign-in</th>
                  <th className="px-3 py-3 font-semibold">Last login</th>
                  <th className="px-3 py-3 font-semibold">Logins</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-line/70 last:border-0">
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="h-9 w-9 rounded-full border border-line object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper-2 text-xs font-semibold">
                            {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.name || 'User'}</p>
                          <p className="truncate text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-muted">{providerLabel(user.authProvider)}</td>
                    <td className="px-3 py-4 text-muted">{formatWhen(user.lastLoginAt)}</td>
                    <td className="px-3 py-4">{user.loginCount || 0}</td>
                    <td className="px-3 py-4">
                      {user.isAdmin ? (
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          Admin
                        </span>
                      ) : user.isBlocked ? (
                        <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      {user.isAdmin ? (
                        <span className="text-xs text-muted">Protected</span>
                      ) : user.isBlocked ? (
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => toggleBlocked(user, false)}
                          className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium hover:bg-paper-2 disabled:opacity-50"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => toggleBlocked(user, true)}
                          className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
