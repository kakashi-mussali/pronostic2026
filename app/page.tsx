"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TEAMS, FLAGS, KICKOFF, teamLabel, PTS } from "@/lib/data";
import { GROUPS, GROUP_MATCHES } from "@/lib/fixtures";
import {
  rankEntries, normalizeBracket, emptyPredictions,
  type Entry, type Results, type Predictions, type Bracket,
} from "@/lib/scoring";

type State = { entries: Entry[]; config: { locked: boolean; results: Results; hasPin: boolean }; hasRedis: boolean };
type Tab = "rules" | "groups" | "bracket" | "bonus" | "board" | "org";

const flag = (t: string) => (FLAGS[t] ? `${FLAGS[t]} ${t}` : t);

/* ---------- petits composants ---------- */
function TeamSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— équipe —</option>
      {TEAMS.map((t) => <option key={t} value={t}>{flag(t)}</option>)}
    </select>
  );
}

function BTeam({ team, active, onClick }: { team: string; active: boolean; onClick?: () => void }) {
  if (!team) return <div className="bteam empty"><span className="nm">À déterminer</span></div>;
  return (
    <div className={`bteam ${active ? "win" : ""}`} onClick={onClick} role="button">
      <span>{FLAGS[team] || "⚽"}</span><span className="nm">{team}</span>
    </div>
  );
}

function GroupsEditor({ value, onChange }: { value: Record<string, [string | number, string | number]>; onChange: (id: string, idx: 0 | 1, v: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ I: true });
  return (
    <>
      {Object.entries(GROUPS).map(([g, teams]) => (
        <details className="grp" key={g} open={!!open[g]}
          onToggle={(e) => setOpen((o) => ({ ...o, [g]: (e.target as HTMLDetailsElement).open }))}>
          <summary>
            <span className="gtag">{g}</span>
            <span className="gteams">{teams.map(flag).join(" · ")}</span>
            <span className="gcaret">▾</span>
          </summary>
          <div className="gbody">
            {[1, 2, 3].map((md) => (
              <div key={md}>
                <div className="md-tag">Journée {md}</div>
                {GROUP_MATCHES.filter((m) => m.group === g && m.md === md).map((m) => {
                  const v = value[m.id] || ["", ""];
                  return (
                    <div className="match" key={m.id}>
                      <div className="tm"><span>{FLAGS[m.home]}</span><span className="nm">{m.home}</span></div>
                      <div className="sc">
                        <input type="number" min={0} max={20} value={v[0]} onChange={(e) => onChange(m.id, 0, e.target.value)} placeholder="-" />
                        <span className="x">–</span>
                        <input type="number" min={0} max={20} value={v[1]} onChange={(e) => onChange(m.id, 1, e.target.value)} placeholder="-" />
                      </div>
                      <div className="tm away"><span className="nm">{m.away}</span><span>{FLAGS[m.away]}</span></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </details>
      ))}
    </>
  );
}

function BracketEditor({ value, onChange }: { value: Bracket; onChange: (b: Bracket) => void }) {
  const b = value;
  const set = (nb: Bracket) => onChange(normalizeBracket(nb));
  const setR32 = (k: number, side: "a" | "b", team: string) =>
    set({ ...b, r32: b.r32.map((m, i) => (i === k ? { ...m, [side]: team } : m)) });
  const pick = (round: "w32" | "w16" | "w8" | "w4", k: number, team: string) => {
    if (!team) return;
    const arr = [...b[round]]; arr[k] = arr[k] === team ? "" : team;
    set({ ...b, [round]: arr } as Bracket);
  };
  const pickChamp = (team: string) => { if (team) set({ ...b, champ: b.champ === team ? "" : team }); };

  return (
    <div className="brk-scroll">
      <div className="brk">
        {/* 16es : sélection des 32 équipes + vainqueur */}
        <div className="brk-col">
          <h4>16es de finale</h4>
          {b.r32.map((m, k) => (
            <div className="bm" key={k}>
              <TeamSelect value={m.a} onChange={(t) => setR32(k, "a", t)} />
              <TeamSelect value={m.b} onChange={(t) => setR32(k, "b", t)} />
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ flex: 1 }}><BTeam team={m.a} active={b.w32[k] === m.a && !!m.a} onClick={() => pick("w32", k, m.a)} /></div>
                <div style={{ flex: 1 }}><BTeam team={m.b} active={b.w32[k] === m.b && !!m.b} onClick={() => pick("w32", k, m.b)} /></div>
              </div>
            </div>
          ))}
        </div>
        {/* 8es */}
        <div className="brk-col">
          <h4>8es de finale</h4>
          {Array.from({ length: 8 }, (_, k) => {
            const fA = b.w32[2 * k], fB = b.w32[2 * k + 1];
            return (
              <div className="bm" key={k}>
                <BTeam team={fA} active={b.w16[k] === fA && !!fA} onClick={() => pick("w16", k, fA)} />
                <BTeam team={fB} active={b.w16[k] === fB && !!fB} onClick={() => pick("w16", k, fB)} />
              </div>
            );
          })}
        </div>
        {/* Quarts */}
        <div className="brk-col">
          <h4>Quarts</h4>
          {Array.from({ length: 4 }, (_, k) => {
            const fA = b.w16[2 * k], fB = b.w16[2 * k + 1];
            return (
              <div className="bm" key={k}>
                <BTeam team={fA} active={b.w8[k] === fA && !!fA} onClick={() => pick("w8", k, fA)} />
                <BTeam team={fB} active={b.w8[k] === fB && !!fB} onClick={() => pick("w8", k, fB)} />
              </div>
            );
          })}
        </div>
        {/* Demies */}
        <div className="brk-col">
          <h4>Demi-finales</h4>
          {Array.from({ length: 2 }, (_, k) => {
            const fA = b.w8[2 * k], fB = b.w8[2 * k + 1];
            return (
              <div className="bm" key={k}>
                <BTeam team={fA} active={b.w4[k] === fA && !!fA} onClick={() => pick("w4", k, fA)} />
                <BTeam team={fB} active={b.w4[k] === fB && !!fB} onClick={() => pick("w4", k, fB)} />
              </div>
            );
          })}
        </div>
        {/* Finale */}
        <div className="brk-col">
          <h4>Finale</h4>
          <div className="bm">
            <BTeam team={b.w4[0]} active={b.champ === b.w4[0] && !!b.w4[0]} onClick={() => pickChamp(b.w4[0])} />
            <BTeam team={b.w4[1]} active={b.champ === b.w4[1] && !!b.w4[1]} onClick={() => pickChamp(b.w4[1])} />
          </div>
        </div>
        {/* Champion */}
        <div className="brk-col brk-champ">
          <h4>Champion</h4>
          <div className="cup">🏆</div>
          <div className="who">{b.champ || "?"}</div>
          <div className="lbl">{b.champ ? flag(b.champ) : "à désigner"}</div>
        </div>
      </div>
    </div>
  );
}

function hasResultsData(res: Results): boolean {
  if (!res) return false;
  return (
    Object.values(res.groups).some((s) => s && s[0] !== "" && s[1] !== "") ||
    !!res.bracket.champ || res.bracket.w16.some(Boolean) || res.bracket.w8.some(Boolean) ||
    res.bracket.w4.some(Boolean) || !!res.scorer || !!res.surprise
  );
}

/* ---------- page ---------- */
export default function Home() {
  const [tab, setTab] = useState<Tab>("rules");
  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const [name, setName] = useState("");
  const [draft, setDraft] = useState<Predictions>(emptyPredictions());
  const [submitting, setSubmitting] = useState(false);

  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [savedPin, setSavedPin] = useState("");
  const [rdraft, setRdraft] = useState<Predictions>(emptyPredictions());

  const showToast = (msg: string, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2800); };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      setState((await res.json()) as State);
    } catch { showToast("Connexion impossible", true); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { if (tab === "board") load(); }, [tab, load]);

  const countdown = useMemo(() => {
    const d = new Date(KICKOFF).getTime() - now;
    if (d <= 0) return null;
    return { days: Math.floor(d / 864e5), h: Math.floor((d % 864e5) / 36e5), m: Math.floor((d % 36e5) / 6e4), s: Math.floor((d % 6e4) / 1e3) };
  }, [now]);

  const ranked = useMemo(() => (state ? rankEntries(state.entries, state.config.results) : []), [state]);
  const hasResults = !!state && hasResultsData(state.config.results);
  const players = state?.entries.length ?? 0;
  const filledCount = useMemo(() => Object.values(draft.groups).filter((s) => s && s[0] !== "" && s[1] !== "").length, [draft]);

  // participant updaters
  const setGroupScore = (id: string, idx: 0 | 1, v: string) =>
    setDraft((d) => { const cur = d.groups[id] || ["", ""]; const nv: [string, string] = idx === 0 ? [v, String(cur[1])] : [String(cur[0]), v]; return { ...d, groups: { ...d.groups, [id]: nv } }; });
  const setBracket = (bb: Bracket) => setDraft((d) => ({ ...d, bracket: bb }));

  // organizer updaters
  const setRGroup = (id: string, idx: 0 | 1, v: string) =>
    setRdraft((d) => { const cur = d.groups[id] || ["", ""]; const nv: [string, string] = idx === 0 ? [v, String(cur[1])] : [String(cur[0]), v]; return { ...d, groups: { ...d.groups, [id]: nv } }; });
  const setRBracket = (bb: Bracket) => setRdraft((d) => ({ ...d, bracket: bb }));

  async function submit() {
    if (!name.trim()) { setTab("groups"); return showToast("Indique d'abord ton prénom (en haut)", true); }
    setSubmitting(true);
    try {
      const res = await fetch("/api/entry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, ...draft }) });
      const data = await res.json();
      if (!res.ok) showToast(data.error || "Erreur", true);
      else { showToast(data.updated ? "Pronos mis à jour ✅" : "Pronos enregistrés ✅"); load(); }
    } catch { showToast("Erreur réseau", true); }
    setSubmitting(false);
  }

  async function admin(action: string, extra: object = {}) {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, pin: savedPin || pin, ...extra }) });
    return { res, data: await res.json() };
  }
  async function enterOrg() {
    if (!pin.trim()) return showToast("Saisis un code", true);
    const action = state?.config.hasPin ? "auth" : "setup";
    const { res, data } = await admin(action);
    if (!res.ok) return showToast(data.error || "Code incorrect", true);
    setSavedPin(pin); setAuthed(true);
    if (state?.config.results) setRdraft({ ...emptyPredictions(), ...state.config.results });
    showToast(action === "setup" ? "Code créé ✅" : "Bienvenue 👋");
  }
  async function saveResults() {
    const { res, data } = await admin("results", { results: rdraft });
    if (!res.ok) return showToast(data.error || "Erreur", true);
    showToast("Résultats enregistrés ✅"); load();
  }
  async function toggleLock() {
    const { res, data } = await admin("lock", { locked: !state?.config.locked });
    if (!res.ok) return showToast(data.error || "Erreur", true);
    showToast(data.locked ? "Pronos verrouillés 🔒" : "Pronos déverrouillés 🔓"); load();
  }
  async function reset() {
    if (!confirm("Tout effacer (participants + résultats) ? Irréversible.")) return;
    const { res, data } = await admin("reset");
    if (!res.ok) return showToast(data.error || "Erreur", true);
    setRdraft(emptyPredictions()); showToast("Concours réinitialisé"); load();
  }

  const SaveBar = (
    <div className="sticky-save">
      <button className="btn primary full" disabled={submitting || state?.config.locked} onClick={submit}>
        {submitting ? "Envoi…" : state?.config.locked ? "🔒 Pronos verrouillés" : `Valider mes pronos${filledCount ? ` (${filledCount}/72 matchs)` : ""}`}
      </button>
    </div>
  );

  return (
    <>
      <div className="topline" />
      <header>
        <div className="kicker">USA · Canada · Mexique — 11 juin › 19 juillet</div>
        <h1>Pronos<span className="yr">Mondial 2026</span></h1>
        <p className="sub">Pronostique les 72 matchs de groupes, construis ton tableau final, et grimpe au classement de tes équipes.</p>
        <div className="count">
          {countdown ? ([["days", "jours"], ["h", "heures"], ["m", "min"], ["s", "sec"]] as const).map(([k, l]) => (
            <div className="cell" key={l}><div className="num">{String(countdown[k]).padStart(2, "0")}</div><div className="lbl">{l}</div></div>
          )) : <div className="cell" style={{ minWidth: "auto", padding: "14px 22px" }}><div className="num" style={{ fontSize: 22 }}>⚽ C&apos;est parti !</div></div>}
        </div>
        <div><span className="pill-stat"><span className="dot" />{players} joueur{players > 1 ? "s" : ""} · 72 matchs · 48 équipes</span></div>
        {state && !state.hasRedis && <div className="banner" style={{ maxWidth: 560, margin: "14px auto 0" }}>⚠️ Aucune base Upstash connectée : pronos non partagés/sauvegardés. Ajoute l&apos;intégration Upstash sur Vercel (voir README).</div>}
      </header>

      <nav>
        <div className="tabs">
          {([["rules", "📋 Règles"], ["groups", "⚽ Matchs"], ["bracket", "🗺️ Cartographie"], ["bonus", "🎁 Bonus"], ["board", "🏆 Classement"], ["org", "🔧 Orga"]] as const).map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => { setTab(k as Tab); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{l}</button>
          ))}
        </div>
      </nav>

      <div className="wrap">
        {!state && <div className="loading">Chargement…</div>}

        {state && tab === "rules" && (
          <section className="panel">
            <div className="card">
              <h2>Comment ça <span className="em">marche</span></h2>
              <p className="lead">Indique ton prénom (onglet Matchs), remplis ce que tu veux, et valide. Tu peux revenir modifier tant que ce n&apos;est pas verrouillé.</p>
              <div className="step-grid">
                <div className="step"><div className="n">1</div><p><b>Matchs</b> : pronostique le score des 72 matchs de groupes.</p></div>
                <div className="step"><div className="n">2</div><p><b>Cartographie</b> : construis ton tableau final, des 16es au champion.</p></div>
                <div className="step"><div className="n">3</div><p><b>Bonus</b> : meilleur buteur, révélation, total de buts (départage).</p></div>
                <div className="step"><div className="n">4</div><p>L&apos;orga saisit les vrais résultats → le <b>classement</b> se calcule tout seul.</p></div>
              </div>
            </div>
            <div className="card">
              <h2>Barème des <span className="em">points</span></h2>
              <table className="score-tbl"><tbody>
                <tr><td>⚽ Match de groupe — <b>score exact</b></td><td className="pts">{PTS.groupExact} pts</td></tr>
                <tr><td>⚽ Match de groupe — bon résultat (1/N/2)</td><td className="pts">{PTS.groupResult} pt</td></tr>
                <tr><td>🗺️ Équipe atteignant les <b>quarts</b> (par équipe)</td><td className="pts">{PTS.bracketQuart} pt</td></tr>
                <tr><td>🗺️ <b>Demi-finaliste</b> correct (par équipe)</td><td className="pts">{PTS.bracketDemi} pts</td></tr>
                <tr><td>🗺️ <b>Finaliste</b> correct (par équipe)</td><td className="pts">{PTS.bracketFinal} pts</td></tr>
                <tr><td>🏆 <b>Champion</b> correct</td><td className="pts">{PTS.bracketChamp} pts</td></tr>
                <tr><td>⚽ <b>Meilleur buteur</b></td><td className="pts">{PTS.scorer} pts</td></tr>
                <tr><td>😮 <b>La révélation</b></td><td className="pts">{PTS.surprise} pts</td></tr>
              </tbody></table>
              <div className="banner">⚖️ <b>Départage :</b> en cas d&apos;égalité, l&apos;estimation du <b>nombre total de buts</b> du tournoi la plus proche l&apos;emporte.</div>
            </div>
          </section>
        )}

        {state && tab === "groups" && (
          <section className="panel">
            <div className="card">
              <h2>Matchs de <span className="em">groupes</span></h2>
              <div className="namerow">
                <div className="field"><label className="fl">Ton prénom / pseudo</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Mustapha (Équipe BioWeb)" maxLength={40} /></div>
              </div>
              <p className="lead">Score de chaque rencontre. Ouvre un groupe pour saisir (le groupe de la France est ouvert).</p>
              {state.config.locked && <div className="banner" style={{ borderColor: "var(--rose)", color: "#ffd2da", background: "rgba(255,77,109,.1)" }}>🔒 Pronos verrouillés.</div>}
              <GroupsEditor value={draft.groups} onChange={setGroupScore} />
              {SaveBar}
            </div>
          </section>
        )}

        {state && tab === "bracket" && (
          <section className="panel">
            <div className="card">
              <h2>La <span className="em">cartographie</span> du tournoi</h2>
              <p className="lead">Choisis tes 32 qualifiés dans les 16es, puis clique sur l&apos;équipe qui passe à chaque tour, jusqu&apos;au champion 🏆.</p>
              <BracketEditor value={draft.bracket} onChange={setBracket} />
              {SaveBar}
            </div>
          </section>
        )}

        {state && tab === "bonus" && (
          <section className="panel">
            <div className="card">
              <h2>Questions <span className="em">bonus</span></h2>
              <p className="lead">Les petits plus qui peuvent faire la différence.</p>
              <div className="field"><label className="fl">⚽ Meilleur buteur du tournoi<span className="p">{PTS.scorer} pts</span></label>
                <input value={draft.scorer} onChange={(e) => setDraft({ ...draft, scorer: e.target.value })} placeholder="Nom du joueur" maxLength={40} /></div>
              <div className="field"><label className="fl">😮 La révélation<span className="p">{PTS.surprise} pts</span></label>
                <input value={draft.surprise} onChange={(e) => setDraft({ ...draft, surprise: e.target.value })} placeholder="Une équipe inattendue" maxLength={40} /></div>
              <div className="field"><label className="fl">🎯 Nombre total de buts du tournoi<span className="p">départage</span></label>
                <input type="number" min={0} max={400} value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} placeholder="Ex. 175" /></div>
              {SaveBar}
            </div>
          </section>
        )}

        {state && tab === "board" && (
          <section className="panel">
            <div className="card">
              <h2>Le <span className="em">classement</span></h2>
              {players === 0 ? <div className="empty">Personne n&apos;a encore joué. Lance-toi dans l&apos;onglet Matchs !</div>
                : hasResults ? (
                  <>
                    <p className="lead">Classement en direct selon les résultats saisis.</p>
                    {ranked.map((row) => {
                      const cls = row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : row.rank === 3 ? "bronze" : "";
                      const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank;
                      return (
                        <div className={`lb-row ${cls}`} key={row.entry.id}>
                          <div className="rk">{medal}</div>
                          <div className="who"><div className="nm">{row.entry.name}</div>
                            <div>
                              <span className="chip">⚽ Groupes {row.bd.groups}</span>
                              <span className="chip">🗺️ Bracket {row.bd.bracket}</span>
                              <span className="chip">🎁 Bonus {row.bd.bonus}</span>
                              {row.bd.exact > 0 && <span className="chip">🎯 {row.bd.exact} score{row.bd.exact > 1 ? "s" : ""} exact{row.bd.exact > 1 ? "s" : ""}</span>}
                            </div>
                          </div>
                          <div className="sc">{row.bd.total}<small>points</small></div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <p className="lead">{players} participant{players > 1 ? "s" : ""}. Le classement s&apos;affichera dès les premiers résultats.</p>
                    {state.entries.map((e) => {
                      const n = Object.values(e.groups).filter((s) => s && s[0] !== "" && s[1] !== "").length;
                      return (
                        <details className="entry" key={e.id}>
                          <summary>👤 {e.name}<span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>champion : {e.bracket.champ ? flag(e.bracket.champ) : "—"} ▾</span></summary>
                          <div className="body">⚽ {n}/72 matchs pronostiqués<br />🏆 Champion : <b>{teamLabel(e.bracket.champ)}</b><br />🥈 Finalistes : <b>{e.bracket.w4.filter(Boolean).map(teamLabel).join(" · ") || "—"}</b><br />⚽ Buteur : <b>{e.scorer || "—"}</b> · 😮 Révélation : <b>{e.surprise || "—"}</b> · 🎯 Total : <b>{e.total || "—"}</b></div>
                        </details>
                      );
                    })}
                  </>
                )}
            </div>
          </section>
        )}

        {state && tab === "org" && (
          <section className="panel">
            <div className="card">
              <h2>Espace <span className="em">organisateur</span></h2>
              {!authed ? (
                <>
                  <p className="lead">Réservé à toi. Saisis les vrais résultats pour lancer le calcul.</p>
                  <div className="field"><label className="fl">{state.config.hasPin ? "Entre le code organisateur" : "Crée le code organisateur"}</label>
                    <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Code secret" maxLength={20} /></div>
                  <button className="btn primary full" onClick={enterOrg}>Entrer</button>
                  <p className="note">{state.config.hasPin ? "Code défini précédemment." : "Première fois : choisis un code, à garder pour toi."}</p>
                </>
              ) : (
                <>
                  <p className="lead">Saisis les vrais scores (onglet plié par groupe) et le vrai tableau final. Tu peux y aller au fur et à mesure.</p>
                  <div className="md-tag">Scores réels des matchs</div>
                  <GroupsEditor value={rdraft.groups} onChange={setRGroup} />
                  <div className="md-tag" style={{ marginTop: 18 }}>Tableau final réel</div>
                  <BracketEditor value={rdraft.bracket} onChange={setRBracket} />
                  <div className="org-grid" style={{ marginTop: 16 }}>
                    <div className="field"><label className="fl">⚽ Meilleur buteur réel</label><input value={rdraft.scorer} onChange={(e) => setRdraft({ ...rdraft, scorer: e.target.value })} placeholder="Nom du joueur" /></div>
                    <div className="field"><label className="fl">😮 Révélation officielle</label><input value={rdraft.surprise} onChange={(e) => setRdraft({ ...rdraft, surprise: e.target.value })} placeholder="Équipe" /></div>
                    <div className="field"><label className="fl">🎯 Total réel de buts</label><input type="number" value={rdraft.total} onChange={(e) => setRdraft({ ...rdraft, total: e.target.value })} placeholder="Ex. 172" /></div>
                  </div>
                  <button className="btn primary full" onClick={saveResults}>Enregistrer les résultats &amp; calculer</button>
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button className="btn ghost" onClick={toggleLock}>{state.config.locked ? "🔓 Déverrouiller" : "🔒 Verrouiller les pronos"}</button>
                    <button className="btn danger" onClick={reset}>🗑️ Réinitialiser</button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        <footer>Concours de pronostics · Coupe du Monde FIFA 2026 · Bonne chance aux équipes ⚽</footer>
      </div>

      {toast && <div className={`toast show ${toast.err ? "err" : ""}`}>{toast.msg}</div>}
    </>
  );
}
