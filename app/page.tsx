"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TEAMS, STAGES, FLAGS, KICKOFF, teamLabel } from "@/lib/data";
import { rankEntries, type Entry, type Results } from "@/lib/scoring";

type State = {
  entries: Entry[];
  config: { locked: boolean; results: Results; hasPin: boolean };
  hasRedis: boolean;
};

const empty = { champ: "", final: "", scorer: "", france: "", surprise: "", fr: "", sn: "", total: "" };

function PickTeam({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isOther = value !== "" && !TEAMS.includes(value);
  const [other, setOther] = useState(isOther);
  if (other || isOther) {
    return (
      <div className="otherwrap">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Nom de l'équipe" maxLength={40} />
        <button type="button" onClick={() => { setOther(false); onChange(""); }}>↩ liste</button>
      </div>
    );
  }
  return (
    <select value={TEAMS.includes(value) ? value : ""} onChange={(e) => {
      if (e.target.value === "__autre") { setOther(true); onChange(""); }
      else onChange(e.target.value);
    }}>
      <option value="">— choisir —</option>
      {TEAMS.map((t) => <option key={t} value={t}>{FLAGS[t] ? `${FLAGS[t]} ${t}` : t}</option>)}
      <option value="__autre">✏️ Autre (saisir)</option>
    </select>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"rules" | "play" | "board" | "org">("rules");
  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  // form (participant)
  const [name, setName] = useState("");
  const [f, setF] = useState({ ...empty });
  const [submitting, setSubmitting] = useState(false);

  // organizer
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [savedPin, setSavedPin] = useState("");
  const [r, setR] = useState({ ...empty });

  const showToast = (msg: string, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2800); };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = (await res.json()) as State;
      setState(data);
      if (data.config.results) setR({ ...empty, ...(data.config.results as object) });
    } catch { showToast("Connexion impossible", true); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { if (tab === "board") load(); }, [tab, load]);

  const countdown = useMemo(() => {
    const d = new Date(KICKOFF).getTime() - now;
    if (d <= 0) return null;
    return {
      days: Math.floor(d / 864e5), h: Math.floor((d % 864e5) / 36e5),
      m: Math.floor((d % 36e5) / 6e4), s: Math.floor((d % 6e4) / 1e3),
    };
  }, [now]);

  const ranked = useMemo(() => state ? rankEntries(state.entries, state.config.results) : [], [state]);
  const hasResults = !!state?.config.results && Object.values(state.config.results).some((v) => v !== "" && v != null);

  async function submit() {
    if (!name.trim()) return showToast("Indique ton prénom 🙂", true);
    if (!f.champ || !f.final) return showToast("Choisis champion + finaliste", true);
    setSubmitting(true);
    try {
      const res = await fetch("/api/entry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...f }),
      });
      const data = await res.json();
      if (!res.ok) showToast(data.error || "Erreur", true);
      else { showToast(data.updated ? "Pronos mis à jour ✅" : "Pronos enregistrés ✅"); load(); }
    } catch { showToast("Erreur réseau", true); }
    setSubmitting(false);
  }

  async function admin(action: string, extra: object = {}) {
    const res = await fetch("/api/admin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, pin: savedPin || pin, ...extra }),
    });
    return { res, data: await res.json() };
  }

  async function enterOrg() {
    if (!pin.trim()) return showToast("Saisis un code", true);
    const action = state?.config.hasPin ? "auth" : "setup";
    const { res, data } = await admin(action);
    if (!res.ok) return showToast(data.error || "Code incorrect", true);
    setSavedPin(pin); setAuthed(true);
    showToast(action === "setup" ? "Code créé ✅" : "Bienvenue 👋");
    load();
  }

  async function saveResults() {
    const { res, data } = await admin("results", { results: r });
    if (!res.ok) return showToast(data.error || "Erreur", true);
    showToast("Résultats enregistrés ✅ classement mis à jour"); load();
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
    showToast("Concours réinitialisé"); load();
  }

  const players = state?.entries.length ?? 0;

  return (
    <>
      <div className="topline" />
      <header>
        <div className="kicker">USA · Canada · Mexique — 11 juin › 19 juillet</div>
        <h1>Pronos<span className="yr">Mondial 2026</span></h1>
        <p className="sub">Le grand concours de pronostics des équipes. Chacun remplit sa grille, le classement se met à jour dès que les vrais résultats tombent.</p>
        <div className="count">
          {countdown ? (
            [["days", "jours"], ["h", "heures"], ["m", "min"], ["s", "sec"]].map(([k, l]) => (
              <div className="cell" key={l}>
                <div className="num">{String((countdown as Record<string, number>)[k]).padStart(2, "0")}</div>
                <div className="lbl">{l}</div>
              </div>
            ))
          ) : (
            <div className="cell" style={{ minWidth: "auto", padding: "14px 22px" }}>
              <div className="num" style={{ fontSize: 22 }}>⚽ C&apos;est parti !</div>
            </div>
          )}
        </div>
        <div><span className="pill-stat"><span className="dot" />{players} joueur{players > 1 ? "s" : ""} · 48 équipes · 12 groupes</span></div>
        {state && !state.hasRedis && (
          <div className="banner" style={{ maxWidth: 520, margin: "14px auto 0" }}>
            ⚠️ Aucune base Upstash connectée : les pronos ne sont pas encore partagés/sauvegardés. Ajoute l&apos;intégration Upstash sur Vercel (voir README).
          </div>
        )}
      </header>

      <nav>
        <div className="tabs">
          {([["rules", "📋 Règles"], ["play", "⚽ Mes pronos"], ["board", "🏆 Classement"], ["org", "🔧 Organisateur"]] as const).map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => { setTab(k); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{l}</button>
          ))}
        </div>
      </nav>

      <div className="wrap">
        {!state && <div className="loading">Chargement…</div>}

        {state && tab === "rules" && (
          <section className="panel">
            <div className="card">
              <h2>Comment ça <span className="em">marche</span></h2>
              <p className="lead">4 étapes, zéro paperasse. Tout se passe sur cette page partagée.</p>
              <div className="step-grid">
                <div className="step"><div className="n">1</div><p>Chaque membre ouvre le lien et remplit sa grille dans <b>Mes pronos</b>.</p></div>
                <div className="step"><div className="n">2</div><p>L&apos;organisateur fixe un code et peut <b>verrouiller</b> les pronos au coup d&apos;envoi.</p></div>
                <div className="step"><div className="n">3</div><p>Au fil du tournoi, l&apos;organisateur saisit les <b>vrais résultats</b>.</p></div>
                <div className="step"><div className="n">4</div><p>Le <b>classement</b> se calcule tout seul. Le meilleur pronostiqueur gagne 🏆</p></div>
              </div>
            </div>
            <div className="card">
              <h2>Barème des <span className="em">points</span></h2>
              <table className="score-tbl"><tbody>
                <tr><td>🏆 <b>Champion du monde</b> exact</td><td className="pts">20 pts</td></tr>
                <tr><td>🥈 <b>Finaliste</b> (l&apos;autre équipe en finale)</td><td className="pts">12 pts</td></tr>
                <tr><td>⚽ <b>Meilleur buteur</b> (Soulier d&apos;or)</td><td className="pts">10 pts</td></tr>
                <tr><td>🇫🇷 <b>Parcours des Bleus</b> — bon stade</td><td className="pts">8 pts</td></tr>
                <tr><td>🇫🇷 Parcours des Bleus — à un tour près</td><td className="pts">4 pts</td></tr>
                <tr><td>😮 <b>La révélation</b> du tournoi</td><td className="pts">6 pts</td></tr>
                <tr><td>🎯 <b>France – Sénégal</b> — score exact</td><td className="pts">6 pts</td></tr>
                <tr><td>🎯 France – Sénégal — bon résultat</td><td className="pts">3 pts</td></tr>
                <tr><td>✨ <b>Bonus</b> : ton champion finit finaliste (ou inversement)</td><td className="pts">+6 pts</td></tr>
              </tbody></table>
              <div className="banner">⚖️ <b>Départage :</b> en cas d&apos;égalité, l&apos;estimation du <b>nombre total de buts</b> du tournoi la plus proche l&apos;emporte.</div>
            </div>
          </section>
        )}

        {state && tab === "play" && (
          <section className="panel">
            <div className="card">
              <h2>Ma <span className="em">grille</span></h2>
              <p className="lead">Remplis tout puis valide. Re-valide avec le <b>même prénom</b> pour modifier (tant que ce n&apos;est pas verrouillé).</p>
              {state.config.locked && <div className="banner" style={{ borderColor: "var(--rose)", color: "#ffd2da", background: "rgba(255,77,109,.1)" }}>🔒 Les pronos sont actuellement verrouillés.</div>}
              <div className="field"><label className="fl"><span className="q">00</span>Ton prénom / pseudo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Mustapha (Équipe BioWeb)" maxLength={40} /></div>
              <div className="field"><label className="fl"><span className="q">01</span>Champion du monde 🏆<span className="p">20 pts</span></label>
                <PickTeam value={f.champ} onChange={(v) => setF({ ...f, champ: v })} /></div>
              <div className="field"><label className="fl"><span className="q">02</span>L&apos;autre finaliste 🥈<span className="p">12 pts</span></label>
                <PickTeam value={f.final} onChange={(v) => setF({ ...f, final: v })} /></div>
              <div className="field"><label className="fl"><span className="q">03</span>Meilleur buteur ⚽<span className="p">10 pts</span></label>
                <input value={f.scorer} onChange={(e) => setF({ ...f, scorer: e.target.value })} placeholder="Nom du joueur" maxLength={40} /></div>
              <div className="field"><label className="fl"><span className="q">04</span>Jusqu&apos;où vont les Bleus ? 🇫🇷<span className="p">8 pts</span></label>
                <select value={f.france} onChange={(e) => setF({ ...f, france: e.target.value })}>
                  <option value="">— choisir —</option>{STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></div>
              <div className="field"><label className="fl"><span className="q">05</span>La révélation 😮<span className="p">6 pts</span></label>
                <input value={f.surprise} onChange={(e) => setF({ ...f, surprise: e.target.value })} placeholder="Une équipe inattendue" maxLength={40} /></div>
              <div className="field"><label className="fl"><span className="q">06</span>Score France – Sénégal 🎯<span className="p">6 pts</span></label>
                <div className="row2">
                  <div className="scorebox"><span className="team">🇫🇷 France</span><input type="number" min={0} max={20} value={f.fr} onChange={(e) => setF({ ...f, fr: e.target.value })} placeholder="0" /></div>
                  <div className="vs">–</div>
                  <div className="scorebox"><span className="team">🇸🇳 Sénégal</span><input type="number" min={0} max={20} value={f.sn} onChange={(e) => setF({ ...f, sn: e.target.value })} placeholder="0" /></div>
                </div></div>
              <div className="field"><label className="fl"><span className="q">07</span>Total de buts du tournoi 🎯<span className="p">départage</span></label>
                <input type="number" min={0} max={400} value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} placeholder="Ex. 175" /></div>
              <button className="btn primary full" disabled={submitting || state.config.locked} onClick={submit}>{submitting ? "Envoi…" : "Valider mes pronos"}</button>
            </div>
          </section>
        )}

        {state && tab === "board" && (
          <section className="panel">
            <div className="card">
              <h2>Le <span className="em">classement</span></h2>
              {players === 0 ? (
                <div className="empty">Personne n&apos;a encore joué. Sois le premier dans « Mes pronos » !</div>
              ) : hasResults ? (
                <>
                  <p className="lead">Classement en direct selon les résultats saisis.</p>
                  {ranked.map((row) => {
                    const cls = row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : row.rank === 3 ? "bronze" : "";
                    const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank;
                    return (
                      <div className={`lb-row ${cls}`} key={row.entry.id}>
                        <div className="rk">{medal}</div>
                        <div className="who"><div className="nm">{row.entry.name}</div>
                          <div>{row.score.parts.length ? row.score.parts.map((p, i) => <span className="chip" key={i}>{p.label} +{p.pts}</span>) : <span className="chip">en attente</span>}</div>
                        </div>
                        <div className="sc">{row.score.total}<small>points</small></div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  <p className="lead">{players} participant{players > 1 ? "s" : ""} inscrit{players > 1 ? "s" : ""}. Le classement s&apos;affichera dès les premiers résultats.</p>
                  {state.entries.map((e) => (
                    <details className="entry" key={e.id}>
                      <summary>👤 {e.name} <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>voir ▾</span></summary>
                      <div className="body">
                        🏆 Champion : <b>{teamLabel(e.champ)}</b><br />🥈 Finaliste : <b>{teamLabel(e.final)}</b><br />
                        ⚽ Buteur : <b>{e.scorer || "—"}</b><br />🇫🇷 Bleus : <b>{e.france || "—"}</b><br />
                        😮 Révélation : <b>{e.surprise || "—"}</b><br />🎯 France–Sénégal : <b>{e.fr !== "" ? e.fr : "?"} – {e.sn !== "" ? e.sn : "?"}</b><br />
                        🎯 Total buts : <b>{e.total || "—"}</b>
                      </div>
                    </details>
                  ))}
                </>
              )}
            </div>
          </section>
        )}

        {state && tab === "org" && (
          <section className="panel">
            <div className="card">
              <h2>Espace <span className="em">organisateur</span></h2>
              <p className="lead">Réservé à toi. Saisis les vrais résultats pour lancer le calcul.</p>
              {!authed ? (
                <>
                  <div className="field"><label className="fl">{state.config.hasPin ? "Entre le code organisateur" : "Crée le code organisateur"}</label>
                    <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Code secret" maxLength={20} /></div>
                  <button className="btn primary full" onClick={enterOrg}>Entrer</button>
                  <p className="note">{state.config.hasPin ? "Code défini précédemment." : "Première fois : choisis un code, à garder pour toi."}</p>
                </>
              ) : (
                <>
                  <div className="org-grid">
                    <div className="field"><label className="fl">🏆 Champion réel</label><PickTeam value={r.champ} onChange={(v) => setR({ ...r, champ: v })} /></div>
                    <div className="field"><label className="fl">🥈 Finaliste réel</label><PickTeam value={r.final} onChange={(v) => setR({ ...r, final: v })} /></div>
                    <div className="field"><label className="fl">⚽ Meilleur buteur réel</label><input value={r.scorer} onChange={(e) => setR({ ...r, scorer: e.target.value })} placeholder="Nom du joueur" /></div>
                    <div className="field"><label className="fl">🇫🇷 Parcours réel des Bleus</label>
                      <select value={r.france} onChange={(e) => setR({ ...r, france: e.target.value })}><option value="">— choisir —</option>{STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="field"><label className="fl">😮 Révélation officielle</label><input value={r.surprise} onChange={(e) => setR({ ...r, surprise: e.target.value })} placeholder="Équipe" /></div>
                    <div className="field"><label className="fl">🎯 Score réel France – Sénégal</label>
                      <div className="row2">
                        <div className="scorebox"><span className="team">🇫🇷</span><input type="number" min={0} value={r.fr} onChange={(e) => setR({ ...r, fr: e.target.value })} placeholder="0" /></div>
                        <div className="vs">–</div>
                        <div className="scorebox"><span className="team">🇸🇳</span><input type="number" min={0} value={r.sn} onChange={(e) => setR({ ...r, sn: e.target.value })} placeholder="0" /></div>
                      </div></div>
                    <div className="field"><label className="fl">🎯 Total réel de buts</label><input type="number" value={r.total} onChange={(e) => setR({ ...r, total: e.target.value })} placeholder="Ex. 172" /></div>
                  </div>
                  <button className="btn primary full" onClick={saveResults}>Enregistrer les résultats &amp; calculer</button>
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button className="btn ghost" onClick={toggleLock}>{state.config.locked ? "🔓 Déverrouiller" : "🔒 Verrouiller les pronos"}</button>
                    <button className="btn danger" onClick={reset}>🗑️ Réinitialiser</button>
                  </div>
                  <p className="note">Tu peux ne remplir qu&apos;une partie des résultats : le classement se met à jour au fur et à mesure.</p>
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
