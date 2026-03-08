'use client';

import { useEffect, useMemo, useState } from 'react';

type NbaGame = { id: string; homeTeam: string; awayTeam: string; commenceTime?: string };
type Group = { id: string; name: string; members: string[] };
type Offer = {
  id: string;
  gameId: string;
  createdBy: string;
  offeredToGroupId: string;
  stakeAmount: string;
  status: 'open' | 'matched' | 'cancelled' | 'settled';
};

type BestLine = { bookmaker: string; outcome: string; price: number; point?: number };

type NavTab = 'setup' | 'market';

function statusChip(status: Offer['status']) {
  switch (status) {
    case 'open':
      return 'bg-zinc-100 text-zinc-700';
    case 'matched':
      return 'bg-blue-100 text-blue-700';
    case 'settled':
      return 'bg-emerald-100 text-emerald-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-zinc-100 text-zinc-700';
  }
}

export default function Home() {
  const [tab, setTab] = useState<NavTab>('setup');
  const [msg, setMsg] = useState('');

  const [userId, setUserId] = useState('elliott');
  const [xrplAddress, setXrplAddress] = useState('');
  const [friendId, setFriendId] = useState('friend1');
  const [groupName, setGroupName] = useState('Friends');
  const [joinGroupId, setJoinGroupId] = useState('');

  const [groups, setGroups] = useState<Group[]>([]);
  const [games, setGames] = useState<NbaGame[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [groupOnly, setGroupOnly] = useState(true);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [side, setSide] = useState<'home' | 'away'>('home');
  const [stake, setStake] = useState('1');
  const [odds, setOdds] = useState('-100');

  const [bestH2h, setBestH2h] = useState<BestLine[]>([]);

  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId), [games, selectedGameId]);
  const currentGroup = useMemo(() => groups.find((g) => g.id === selectedGroupId), [groups, selectedGroupId]);
  const visibleOffers = useMemo(
    () => (groupOnly && selectedGroupId ? offers.filter((o) => o.offeredToGroupId === selectedGroupId) : offers),
    [offers, groupOnly, selectedGroupId],
  );

  async function loadAll() {
    const [grpRes, gameRes, offRes] = await Promise.all([
      fetch('/api/groups').then((r) => r.json()),
      fetch('/api/nba/games').then((r) => r.json()),
      fetch('/api/bets/offers').then((r) => r.json()),
    ]);
    setGroups(grpRes.groups ?? []);
    setGames(gameRes.games ?? []);
    setOffers(offRes.offers ?? []);

    if (!selectedGroupId && grpRes.groups?.length) setSelectedGroupId(grpRes.groups[0].id);
    if (!selectedGameId && gameRes.games?.length) setSelectedGameId(gameRes.games[0].id);
  }

  useEffect(() => {
    loadAll().catch((e) => setMsg(String(e)));
  }, []);

  async function saveUser() {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, displayName: userId, xrplAddress: xrplAddress || undefined }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? 'Failed to save user');
    setMsg(`Saved user ${data.user.id}`);
  }

  async function addFriend() {
    await saveUser();
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: friendId, displayName: friendId }),
    });
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: userId, b: friendId }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? 'Failed to add friend');
    setMsg(`Friend linked: ${data.friendship.a} ↔ ${data.friendship.b}`);
  }

  async function createGroup() {
    await saveUser();
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, createdBy: userId }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? 'Failed to create group');
    setMsg(`Group created: ${data.group.name}`);
    await loadAll();
  }

  async function joinGroup() {
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: joinGroupId, userId }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? 'Failed to join group');
    setMsg(`Joined group: ${data.group.name}`);
    await loadAll();
  }

  async function compareMarket() {
    if (!selectedGameId) return setMsg('Select a game first');
    const res = await fetch(`/api/nba/compare?gameId=${encodeURIComponent(selectedGameId)}`);
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? 'Failed to compare market');
    const lines = data?.comparison?.bestByMarket?.h2h ?? [];
    setBestH2h(lines);
    if (lines.length) setOdds('-100'); // no-vig default display
  }

  async function createOffer() {
    if (!selectedGroupId || !selectedGameId) return setMsg('Select group and game');

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const res = await fetch('/api/bets/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: selectedGameId,
        createdBy: userId,
        offeredToGroupId: selectedGroupId,
        side,
        stakeAmount: stake,
        stakeToken: 'LUSD',
        oddsAmerican: Number(odds),
        expiresAt,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? 'Create offer failed');
    setMsg(`Offer created ${data.offer.id.slice(0, 8)}...`);
    await loadAll();
  }

  async function acceptOffer(offerId: string) {
    const acceptor = prompt('Acceptor user id', 'friend1');
    if (!acceptor) return;
    const res = await fetch('/api/bets/offers/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, acceptedBy: acceptor }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? 'Accept failed (must be friend + in group)');
    setMsg(`Offer matched by ${data.offer.acceptedBy}`);
    await loadAll();
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border bg-white p-4 shadow-sm">
          <h1 className="text-lg font-bold">Coinflip</h1>
          <p className="mt-1 text-sm text-zinc-500">The 50/50 Market</p>

          <div className="mt-6 space-y-2">
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${tab === 'setup' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
              onClick={() => setTab('setup')}
            >
              User / Friends / Groups
            </button>
            <button
              className={`w-full rounded-lg px-3 py-2 text-left ${tab === 'market' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
              onClick={() => setTab('market')}
            >
              Markets / Offers
            </button>
          </div>

          <div className="mt-6 rounded-lg border bg-zinc-50 p-3 text-xs text-zinc-600">
            <div className="font-medium text-zinc-800">Coinflip Promise</div>
            <ul className="mt-2 list-disc pl-4">
              <li>Friends-only market access</li>
              <li>No house edge pricing</li>
              <li>Verifiable settlement trail</li>
            </ul>
          </div>
        </aside>

        <section className="space-y-6">
          <header className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold">Coinflip - The 50/50 Market</h2>
            <p className="mt-1 text-zinc-600">Friends-only peer betting without sportsbook vig.</p>
            {msg && <div className="mt-3 rounded-lg border bg-zinc-50 p-2 text-sm">{msg}</div>}
          </header>

          {tab === 'setup' ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <article className="rounded-2xl border bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">User Profile</h3>
                <p className="mb-4 text-sm text-zinc-500">Set your identity and XRPL address.</p>
                <div className="space-y-3">
                  <input className="w-full rounded-lg border p-2.5" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
                  <input className="w-full rounded-lg border p-2.5" value={xrplAddress} onChange={(e) => setXrplAddress(e.target.value)} placeholder="XRPL address (r...)" />
                  <button className="w-full rounded-lg bg-zinc-900 px-3 py-2.5 font-medium text-white" onClick={saveUser}>Save User</button>
                </div>
              </article>

              <article className="rounded-2xl border bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Friends</h3>
                <p className="mb-4 text-sm text-zinc-500">Only friends can accept each other’s offers.</p>
                <div className="space-y-3">
                  <input className="w-full rounded-lg border p-2.5" value={friendId} onChange={(e) => setFriendId(e.target.value)} placeholder="Friend user ID" />
                  <button className="w-full rounded-lg bg-zinc-900 px-3 py-2.5 font-medium text-white" onClick={addFriend}>Add Friend</button>
                </div>
              </article>

              <article className="rounded-2xl border bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Groups</h3>
                <p className="mb-4 text-sm text-zinc-500">Create or join private markets with trusted people.</p>
                <div className="space-y-3">
                  <input className="w-full rounded-lg border p-2.5" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" />
                  <button className="w-full rounded-lg border px-3 py-2.5" onClick={createGroup}>Create Group</button>
                  <input className="w-full rounded-lg border p-2.5" value={joinGroupId} onChange={(e) => setJoinGroupId(e.target.value)} placeholder="Group ID" />
                  <button className="w-full rounded-lg border px-3 py-2.5" onClick={joinGroup}>Join Group</button>
                </div>
              </article>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
              <article className="rounded-2xl border bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Create Head-to-Head Offer</h3>
                <p className="mb-4 text-sm text-zinc-500">Select a game, choose side, and post a no-vig offer to your private group.</p>
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">Current group:</span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700">{currentGroup ? `${currentGroup.name} (${currentGroup.members.length})` : 'No group selected'}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.9fr_1.1fr]">
                  <select className="w-full rounded-lg border p-2.5" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                    <option value="">Select Group</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.members.length})</option>)}
                  </select>
                  <select className="w-full rounded-lg border p-2.5" value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)}>
                    <option value="">Choose Game</option>
                    {games.map((g) => <option key={g.id} value={g.id}>{g.awayTeam} @ {g.homeTeam}</option>)}
                  </select>
                  <select className="rounded-lg border p-2.5" value={side} onChange={(e) => setSide(e.target.value as 'home' | 'away')}>
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                  </select>
                  <input className="rounded-lg border p-2.5" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="Stake (LUSD)" />
                </div>

                <div className="mt-4 rounded-xl border bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">Fair odds (no-vig)</div>
                  <div className="mt-1 text-lg font-semibold">{odds} / {odds}</div>
                  <div className="text-xs text-zinc-500">Sportsbook lines are de-vigged to 50/50 in Coinflip.</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="rounded-lg border px-3 py-2" onClick={compareMarket}>Compare Market</button>
                  <button className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white" onClick={createOffer}>Create Offer</button>
                </div>

                {!!bestH2h.length && (
                  <div className="mt-4 rounded-xl border p-3">
                    <div className="mb-2 text-sm font-semibold">Best available h2h lines</div>
                    <div className="space-y-1 text-sm">
                      {bestH2h.map((x, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>{x.outcome}</span>
                          <span className="font-mono">{x.price} @ {x.bookmaker}</span>
                        </div>
                      ))}
                    </div>
                    {selectedGame && <div className="mt-2 text-xs text-zinc-500">{selectedGame.awayTeam} @ {selectedGame.homeTeam}</div>}
                  </div>
                )}
              </article>

              <article className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">Active Offers</h3>
                    <p className="text-xs text-zinc-500">Showing {groupOnly ? 'selected group only' : 'all groups'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-zinc-600">
                      <input type="checkbox" checked={groupOnly} onChange={(e) => setGroupOnly(e.target.checked)} />
                      Group only
                    </label>
                    <button className="rounded-lg border px-3 py-1.5 text-xs" onClick={() => loadAll()}>Refresh</button>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
                    <thead className="text-zinc-500">
                      <tr>
                        <th className="px-2">Offer ID</th>
                        <th className="px-2">Creator</th>
                        <th className="px-2">Stake</th>
                        <th className="px-2">Status</th>
                        <th className="px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleOffers.map((o) => (
                        <tr key={o.id} className="rounded-lg bg-zinc-50 hover:bg-zinc-100">
                          <td className="px-2 py-2 font-mono" title={o.id}>{o.id.slice(0, 8)}...</td>
                          <td className="px-2 py-2">{o.createdBy}</td>
                          <td className="px-2 py-2">{o.stakeAmount} LUSD</td>
                          <td className="px-2 py-2"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusChip(o.status)}`}>{o.status}</span></td>
                          <td className="px-2 py-2">
                            {o.status === 'open' ? (
                              <button className="rounded-lg border px-2 py-1" onClick={() => acceptOffer(o.id)}>Accept</button>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
