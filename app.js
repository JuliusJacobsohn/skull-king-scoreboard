(() => {
  const KEY = "skullking_mobile_v1";
  const ARCHIVE_KEY = `${KEY}_archived_games`;
  const LANG_KEY = `${KEY}_lang`;

  const I18N = {
    en: {
      languageName: "English",
      appTitle: "Skull King Mobile Score",
      setupPlayers: "Players",
      setupStartGame: "Start game",
      setupHint: "Add players, then start. Player order determines turn highlight.",
      setupPlayerPlaceholder: "Player name",
      setupAddPlayer: "Add",
      setupRecentPlayers: "Recent players",
      setupSeeHistory: "See history",
      setupPlayerStatistics: "Player statistics",
      setupLanguage: "Language",
      setupNoPlayersYet: "No players yet.",
      setupMoveUp: "Move up",
      setupMoveDown: "Move down",
      setupRemove: "Remove",
      setupMoveUpShort: "Up",
      setupMoveDownShort: "Down",
      setupRemoveShort: "X",
      gameRound: "Round",
      gameNewGame: "New game",
      gameHistory: "History",
      gameRoundDone: "Round done",
      historyTitle: "History",
      historyClose: "Close",
      historyViewsAriaLabel: "History views",
      historyTabHistory: "History",
      historyTabGraph: "Graph",
      historyGraphAriaLabel: "Score progression graph",
      archiveTitle: "Game archive",
      archiveClose: "Close",
      archiveViewsAriaLabel: "Archive views",
      archiveTabGames: "Games",
      archiveTabStats: "Player statistics",
      archiveNoGames: "No saved games yet.",
      archiveSummaryLine: "{games} games | {players} players",
      archivePlayedAt: "Played",
      archiveRounds: "Rounds",
      archivePlayers: "Players",
      archiveWinners: "Winners",
      archiveTopScore: "Top score",
      archiveRoundHeader: "Round",
      statsPlayerLabel: "Player for details",
      statsNoData: "No archived games yet.",
      statsHeaderPlayer: "Player",
      statsHeaderGames: "Games",
      statsHeaderWon: "Won",
      statsHeaderLost: "Lost",
      statsHeaderWinRate: "Win %",
      statsHeaderMax: "Max",
      statsHeaderAvg: "Avg",
      statsHeaderMin: "Min",
      statsHeaderTotal: "Total",
      statsHeaderAvgRank: "Avg rank",
      statsChartWinLoss: "Wins vs losses",
      statsChartPoints: "Min / Avg / Max points",
      statsChartTrend: "Score trend",
      statsChartPositions: "Finish positions",
      statsAxisGames: "Games",
      statsAxisPoints: "Points",
      statsAxisRank: "Rank",
      statsPositionPrefix: "Position",
      entryNoPlayers: "No players.",
      entryTotal: "Total",
      entryRound: "Round",
      entryBid: "Bid",
      entryWon: "Won",
      entryPirates: "Pirates (+30)",
      entryMermaid: "Mermaid (+50)",
      entryMermaidToggle: "Mermaid beat SK",
      histRoundHeader: "Round",
      histNoHistory: "No history.",
      histNoCompleted: "No completed rounds yet.",
      histTotal: "Total",
      histMissing: "-",
      graphNoPlayers: "No players.",
      graphNoCompleted: "No completed rounds yet.",
      graphXAxis: "Round",
      graphYAxis: "Score",
      alertAddPlayer: "Add at least one player.",
      confirmNewGame: "Start a new game? This will delete all players and history.",
      fallbackPlayerName: "Player"
    },
    de: {
      languageName: "Deutsch",
      appTitle: "Skull King Mobile Punkte",
      setupPlayers: "Spieler",
      setupStartGame: "Spiel starten",
      setupHint: "Füge Spieler hinzu und starte dann. Die Reihenfolge bestimmt die Zug-Markierung.",
      setupPlayerPlaceholder: "Spielername",
      setupAddPlayer: "Hinzufügen",
      setupRecentPlayers: "Recent players",
      setupSeeHistory: "See history",
      setupPlayerStatistics: "Player statistics",
      setupLanguage: "Sprache",
      setupNoPlayersYet: "Noch keine Spieler.",
      setupMoveUp: "Nach oben",
      setupMoveDown: "Nach unten",
      setupRemove: "Entfernen",
      setupMoveUpShort: "Hoch",
      setupMoveDownShort: "Runter",
      setupRemoveShort: "X",
      gameRound: "Runde",
      gameNewGame: "Neues Spiel",
      gameHistory: "Verlauf",
      gameRoundDone: "Runde abschließen",
      historyTitle: "Verlauf",
      historyClose: "Schließen",
      historyViewsAriaLabel: "Verlaufsansichten",
      historyTabHistory: "Verlauf",
      historyTabGraph: "Grafik",
      historyGraphAriaLabel: "Punkteverlauf",
      entryNoPlayers: "Keine Spieler.",
      entryTotal: "Gesamt",
      entryRound: "Runde",
      entryBid: "Ansage",
      entryWon: "Stiche",
      entryPirates: "Piraten (+30)",
      entryMermaid: "Meerjungfrau (+50)",
      entryMermaidToggle: "MJF schlug SK",
      histRoundHeader: "Runde",
      histNoHistory: "Kein Verlauf.",
      histNoCompleted: "Noch keine abgeschlossenen Runden.",
      histTotal: "Gesamt",
      histMissing: "-",
      graphNoPlayers: "Keine Spieler.",
      graphNoCompleted: "Noch keine abgeschlossenen Runden.",
      graphXAxis: "Runde",
      graphYAxis: "Punkte",
      alertAddPlayer: "Mindestens einen Spieler hinzufügen.",
      confirmNewGame: "Neues Spiel starten? Alle Spieler und der Verlauf werden gelöscht.",
      fallbackPlayerName: "Spieler"
    }
  };

  const $ = (s) => document.querySelector(s);
  const el = (t, p = {}) => Object.assign(document.createElement(t), p);
  const safeInt = (v) => Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : 0;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const MAX_PIRATES_BONUS = 6;
  const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)));
  const nowIso = () => new Date().toISOString();

  let language = loadLanguage();
  let historyTab = "history";
  let historyChart = null;
  let archiveTab = "games";
  let statsSelectedPlayer = "";
  let statsCharts = {
    winLoss: null,
    points: null,
    trend: null,
    positions: null
  };

  const DEFAULT = {
    mode: "setup",
    round: 1,
    sessionId: null,
    startedAt: null,
    players: [],
    current: {},
    done: []
  };

  let state = load();
  let archivedGames = loadArchive();
  saveArchive();

  function t(key){
    const table = I18N[language] || I18N.en;
    if(Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    if(Object.prototype.hasOwnProperty.call(I18N.en, key)) return I18N.en[key];
    return key;
  }

  function tf(key, values = {}){
    let text = String(t(key));
    for(const [k, v] of Object.entries(values)){
      text = text.replaceAll(`{${k}}`, String(v));
    }
    return text;
  }

  function loadLanguage(){
    try {
      const stored = localStorage.getItem(LANG_KEY);
      return I18N[stored] ? stored : "en";
    } catch {
      return "en";
    }
  }

  function saveLanguage(){
    localStorage.setItem(LANG_KEY, language);
  }

  function setLanguage(next){
    if(!I18N[next] || next === language) return;
    language = next;
    saveLanguage();
    render();
  }

  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if(!raw) return structuredClone(DEFAULT);
      const s = Object.assign(structuredClone(DEFAULT), JSON.parse(raw));

      s.mode = (s.mode === "game") ? "game" : "setup";
      s.round = Math.max(1, safeInt(s.round));
      s.sessionId = s.sessionId ? String(s.sessionId) : null;
      s.startedAt = s.startedAt ? String(s.startedAt) : null;

      s.players = Array.isArray(s.players)
        ? s.players.map((p) => ({
          id: String(p.id || uid()),
          name: String(p.name || t("fallbackPlayerName")).trim(),
          total: safeInt(p.total)
        })).filter((p) => p.name)
        : [];

      s.current = (s.current && typeof s.current === "object") ? s.current : {};
      s.done = Array.isArray(s.done) ? s.done : [];

      for(const p of s.players) ensureCurrent(s, p.id);
      if(s.mode === "game" && !s.sessionId) s.sessionId = uid();
      if(s.mode === "game" && !s.startedAt) s.startedAt = nowIso();

      return s;
    } catch {
      return structuredClone(DEFAULT);
    }
  }

  function save(){
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function loadArchive(){
    try {
      const raw = localStorage.getItem(ARCHIVE_KEY);
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed)) return [];
      return dedupeArchive(parsed.map(sanitizeArchivedGame).filter(Boolean));
    } catch {
      return [];
    }
  }

  function saveArchive(){
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedGames));
  }

  function sanitizeArchivedGame(game){
    if(!game || typeof game !== "object") return null;

    const startedAt = game.startedAt ? String(game.startedAt) : null;
    const finishedAt = game.finishedAt ? String(game.finishedAt) : null;
    const updatedAt = game.updatedAt ? String(game.updatedAt) : finishedAt || startedAt || nowIso();

    const players = Array.isArray(game.players)
      ? game.players.map((name) => String(name || "").trim()).filter(Boolean)
      : [];

    const rounds = Array.isArray(game.rounds)
      ? game.rounds.map((round) => sanitizeArchivedRound(round))
      : [];

    const finalTotals = Array.isArray(game.finalTotals)
      ? game.finalTotals
        .map((row) => ({
          name: String(row?.name || "").trim(),
          total: safeInt(row?.total)
        }))
        .filter((row) => row.name)
      : [];

    const winners = Array.isArray(game.winners)
      ? game.winners.map((name) => String(name || "").trim()).filter(Boolean)
      : [];

    const sessionId = game.sessionId ? String(game.sessionId) : uid();
    const roundsPlayed = Math.max(0, safeInt(game.roundsPlayed || rounds.length));

    return {
      id: game.id ? String(game.id) : sessionId,
      sessionId,
      startedAt,
      finishedAt,
      updatedAt,
      roundsPlayed,
      players,
      rounds,
      finalTotals,
      winners
    };
  }

  function sanitizeArchivedRound(round){
    const entries = Array.isArray(round?.entries)
      ? round.entries.map((entry) => ({
        name: String(entry?.name || "").trim(),
        bid: safeInt(entry?.bid),
        won: safeInt(entry?.won),
        pirates: safeInt(entry?.pirates),
        mermaid: !!entry?.mermaid,
        pts: safeInt(entry?.pts),
        total: safeInt(entry?.total)
      })).filter((entry) => entry.name)
      : [];

    return {
      round: Math.max(1, safeInt(round?.round)),
      entries
    };
  }

  function dedupeArchive(records){
    const bySession = new Map();
    for(const rec of records){
      if(!rec || !rec.sessionId) continue;
      const prev = bySession.get(rec.sessionId);
      if(!prev){
        bySession.set(rec.sessionId, rec);
        continue;
      }
      const prevStamp = Date.parse(prev.updatedAt || prev.finishedAt || prev.startedAt || "");
      const curStamp = Date.parse(rec.updatedAt || rec.finishedAt || rec.startedAt || "");
      const prevTime = Number.isFinite(prevStamp) ? prevStamp : 0;
      const curTime = Number.isFinite(curStamp) ? curStamp : 0;
      if(curTime >= prevTime) bySession.set(rec.sessionId, rec);
    }
    return [...bySession.values()].sort((a, b) => {
      const aStamp = Date.parse(a.finishedAt || a.updatedAt || a.startedAt || "");
      const bStamp = Date.parse(b.finishedAt || b.updatedAt || b.startedAt || "");
      return (Number.isFinite(bStamp) ? bStamp : 0) - (Number.isFinite(aStamp) ? aStamp : 0);
    });
  }

  function setText(selector, value){
    const node = $(selector);
    if(node) node.textContent = value;
  }

  function syncModalOpenClass(){
    const historyModal = $("#historyModal");
    const archiveModal = $("#archiveModal");
    const historyOpen = !!historyModal && !historyModal.classList.contains("hidden");
    const archiveOpen = !!archiveModal && !archiveModal.classList.contains("hidden");
    const anyOpen = historyOpen || archiveOpen;
    document.body.classList.toggle("modalOpen", !!anyOpen);
  }

  function renderLanguageSelector(){
    const select = $("#languageSelect");
    if(!select) return;

    const codes = Object.keys(I18N);
    select.innerHTML = "";
    for(const code of codes){
      select.appendChild(el("option", {
        value: code,
        textContent: I18N[code].languageName
      }));
    }
    select.value = language;
  }

  function applyStaticTranslations(){
    document.documentElement.lang = language;
    document.title = t("appTitle");
    setText("#setupTitle", t("setupPlayers"));
    setText("#btnStart", t("setupStartGame"));
    setText("#setupHint", t("setupHint"));
    setText("#languageLabel", t("setupLanguage"));
    setText("#btnAdd", t("setupAddPlayer"));
    setText("#recentPlayersLabel", t("setupRecentPlayers"));
    setText("#btnSetupHistory", t("setupSeeHistory"));
    setText("#btnSetupStats", t("setupPlayerStatistics"));
    setText("#roundPillText", t("gameRound"));
    setText("#btnNewGame", t("gameNewGame"));
    setText("#btnHistory", t("gameHistory"));
    setText("#btnDone", t("gameRoundDone"));
    setText("#historyTitle", t("historyTitle"));
    setText("#btnCloseHistory", t("historyClose"));
    setText("#btnTabHistory", t("historyTabHistory"));
    setText("#btnTabGraph", t("historyTabGraph"));
    setText("#archiveTitle", t("archiveTitle"));
    setText("#btnCloseArchive", t("archiveClose"));
    setText("#btnTabArchiveGames", t("archiveTabGames"));
    setText("#btnTabArchiveStats", t("archiveTabStats"));
    setText("#statsPlayerLabel", t("statsPlayerLabel"));

    const input = $("#playerName");
    if(input) input.placeholder = t("setupPlayerPlaceholder");

    const historyTabs = $("#historyTabs");
    if(historyTabs) historyTabs.setAttribute("aria-label", t("historyViewsAriaLabel"));

    const graphCanvas = $("#histGraphCanvas");
    if(graphCanvas) graphCanvas.setAttribute("aria-label", t("historyGraphAriaLabel"));

    const archiveTabs = $("#archiveTabs");
    if(archiveTabs) archiveTabs.setAttribute("aria-label", t("archiveViewsAriaLabel"));

    renderLanguageSelector();
  }

  function ensureCurrent(s, pid){
    if(!s.current[pid]){
      s.current[pid] = { bid: "0", won: "0", pirates: "0", mermaid: false, wonTouched: false };
      return;
    }
    const c = s.current[pid];
    if(c.bid === undefined || c.bid === "") c.bid = "0";
    if(c.won === undefined || c.won === "") c.won = "0";
    if(c.pirates === undefined || c.pirates === "") c.pirates = "0";
    if(typeof c.mermaid !== "boolean") c.mermaid = !!c.mermaid;
    if(typeof c.wonTouched !== "boolean") c.wonTouched = false;
  }

  function turnIndex(){
    if(state.players.length === 0) return -1;
    return (state.round - 1) % state.players.length;
  }

  function basePointsFor(round, bid, won){
    bid = safeInt(bid);
    won = safeInt(won);
    if(bid === 0) return (won === 0) ? (10 * round) : (-10 * round);
    return (won === bid) ? (20 * bid) : (-10 * Math.abs(bid - won));
  }

  function hitTarget(bid, won){
    return safeInt(bid) === safeInt(won);
  }

  function bonusAllowed(bid, won){
    return safeInt(bid) > 0 && hitTarget(bid, won);
  }

  function totalRoundPoints(round, entry){
    const base = basePointsFor(round, entry.bid, entry.won);
    const allowBonus = bonusAllowed(entry.bid, entry.won);
    const pirates = allowBonus ? clamp(safeInt(entry.pirates), 0, MAX_PIRATES_BONUS) : 0;
    const mermaid = allowBonus ? !!entry.mermaid : false;
    return base + (pirates * 30) + (mermaid ? 50 : 0);
  }

  function playerColor(index){
    const hue = Math.round((index * 137.508) % 360);
    return `hsl(${hue} 85% 60%)`;
  }

  function signed(value){
    return `${value >= 0 ? "+" : ""}${value}`;
  }

  function normalizeName(name){
    return String(name || "").trim().toLowerCase();
  }

  function parseStamp(value){
    if(typeof value === "number" && Number.isFinite(value)) return value;
    const stamp = Date.parse(String(value || ""));
    return Number.isFinite(stamp) ? stamp : 0;
  }

  function formatStamp(value){
    const stamp = parseStamp(value);
    if(!stamp) return "-";
    return new Intl.DateTimeFormat(language, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(stamp));
  }

  function archiveSortStamp(game){
    return parseStamp(game?.finishedAt || game?.updatedAt || game?.startedAt);
  }

  function getRecentPlayers(limit = 5){
    const seen = new Set();
    const result = [];

    for(const game of archivedGames){
      const roster = Array.isArray(game.players) ? game.players : [];
      for(let i = roster.length - 1; i >= 0; i -= 1){
        const name = String(roster[i] || "").trim();
        if(!name) continue;
        const key = normalizeName(name);
        if(!key || seen.has(key)) continue;
        seen.add(key);
        result.push(name);
        if(result.length >= limit) return result;
      }
    }
    return result;
  }

  function buildArchivedGameFromState(finishedAt){
    if(!state.sessionId || state.done.length === 0) return null;

    const players = state.players.map((p) => p.name).filter(Boolean);
    const rounds = state.done.map((roundRec) => {
      const entries = state.players.map((p) => {
        const entry = roundRec.entries?.[p.id] || {};
        return {
          name: p.name,
          bid: safeInt(entry.bid),
          won: safeInt(entry.won),
          pirates: safeInt(entry.pirates),
          mermaid: !!entry.mermaid,
          pts: safeInt(entry.pts),
          total: safeInt(roundRec.totals?.[p.id])
        };
      });
      return { round: Math.max(1, safeInt(roundRec.round)), entries };
    });

    const finalTotals = state.players.map((p) => ({ name: p.name, total: safeInt(p.total) }));
    const best = finalTotals.length ? Math.max(...finalTotals.map((r) => r.total)) : 0;
    const winners = finalTotals.filter((r) => r.total === best).map((r) => r.name);

    return {
      id: state.sessionId,
      sessionId: state.sessionId,
      startedAt: state.startedAt || finishedAt,
      finishedAt,
      updatedAt: finishedAt,
      roundsPlayed: state.done.length,
      players,
      rounds,
      finalTotals,
      winners
    };
  }

  function upsertArchiveFromState(){
    const finishedAt = nowIso();
    const rec = buildArchivedGameFromState(finishedAt);
    if(!rec) return;

    const index = archivedGames.findIndex((g) => g.sessionId === rec.sessionId);
    if(index >= 0){
      archivedGames[index] = rec;
    } else {
      archivedGames.push(rec);
    }

    archivedGames = dedupeArchive(archivedGames);
    saveArchive();
  }

  function setHistoryTab(tab){
    historyTab = (tab === "graph") ? "graph" : "history";

    const btnHistory = $("#btnTabHistory");
    const btnGraph = $("#btnTabGraph");
    const panelHistory = $("#tabPanelHistory");
    const panelGraph = $("#tabPanelGraph");
    const showingHistory = historyTab === "history";

    if(btnHistory){
      btnHistory.classList.toggle("active", showingHistory);
      btnHistory.setAttribute("aria-selected", showingHistory ? "true" : "false");
    }
    if(btnGraph){
      btnGraph.classList.toggle("active", !showingHistory);
      btnGraph.setAttribute("aria-selected", showingHistory ? "false" : "true");
    }
    if(panelHistory) panelHistory.classList.toggle("hidden", !showingHistory);
    if(panelGraph) panelGraph.classList.toggle("hidden", showingHistory);
    if(!showingHistory) renderGraph();
  }

  function autoFillLastWon(){
    if(state.players.length === 0) return false;

    let touchedCount = 0;
    let touchedSum = 0;
    let untouchedPid = null;
    let untouchedCount = 0;

    for(const p of state.players){
      ensureCurrent(state, p.id);
      const cur = state.current[p.id];
      if(cur.wonTouched){
        touchedCount += 1;
        touchedSum += clamp(safeInt(cur.won), 0, state.round);
      } else {
        untouchedCount += 1;
        untouchedPid = p.id;
      }
    }

    if(touchedCount !== state.players.length - 1 || untouchedCount !== 1) return false;

    const remaining = state.round - touchedSum;
    if(remaining < 0 || remaining > state.round) return false;

    const target = state.current[untouchedPid];
    const nextWon = String(remaining);
    const nextPirates = String(clamp(safeInt(target.pirates), 0, Math.min(MAX_PIRATES_BONUS, remaining)));
    if(target.won === nextWon && target.pirates === nextPirates) return false;

    target.won = nextWon;
    target.pirates = nextPirates;
    return true;
  }

  function render(){
    applyStaticTranslations();

    const setup = $("#setupScreen");
    const game = $("#gameScreen");
    if(state.mode === "setup"){
      setup.classList.remove("hidden");
      game.classList.add("hidden");
      closeHistoryModal();
      renderSetup();
    } else {
      setup.classList.add("hidden");
      game.classList.remove("hidden");
      renderGame();
    }

    if(!$("#archiveModal").classList.contains("hidden")) renderArchiveModal();
  }

  function renderSetup(){
    renderRecentPlayers();

    const chips = $("#chips");
    chips.innerHTML = "";

    if(state.players.length === 0){
      chips.appendChild(el("div", { className: "small", textContent: t("setupNoPlayersYet") }));
    } else {
      state.players.forEach((p, idx) => {
        const c = el("div", { className: "chip" + (idx === 0 ? " starterChip" : "") });
        c.appendChild(el("span", { textContent: p.name }));

        const up = el("button", { textContent: t("setupMoveUpShort"), title: t("setupMoveUp") });
        up.onclick = () => movePlayer(idx, -1);

        const dn = el("button", { textContent: t("setupMoveDownShort"), title: t("setupMoveDown") });
        dn.onclick = () => movePlayer(idx, +1);

        const del = el("button", { className: "btnDanger", textContent: t("setupRemoveShort"), title: t("setupRemove") });
        del.onclick = () => removePlayerSetup(p.id);

        c.appendChild(up);
        c.appendChild(dn);
        c.appendChild(del);
        chips.appendChild(c);
      });
    }
  }

  function renderRecentPlayers(){
    const wrap = $("#recentPlayersWrap");
    const list = $("#recentPlayers");
    if(!wrap || !list) return;

    const currentNames = new Set(state.players.map((p) => normalizeName(p.name)));
    const recent = getRecentPlayers(5).filter((name) => !currentNames.has(normalizeName(name)));

    list.innerHTML = "";
    if(recent.length === 0){
      wrap.classList.add("hidden");
      return;
    }

    wrap.classList.remove("hidden");
    for(const name of recent){
      const chip = el("div", { className: "chip" });
      const btn = el("button", {
        type: "button",
        textContent: name
      });
      btn.onclick = () => addPlayer(name);
      chip.appendChild(btn);
      list.appendChild(chip);
    }
  }

  function renderGame(){
    $("#roundLabel").textContent = String(state.round);

    const sorted = [...state.players].sort((a, b) => (b.total - a.total));
    const top = sorted.slice(0, Math.min(3, sorted.length))
      .map((p) => `${p.name} ${signed(p.total)}`)
      .join(" | ");
    $("#leaderLine").textContent = top || "";

    renderEntries();
    renderHistory();
    if(historyTab === "graph" && !$("#historyModal").classList.contains("hidden")) renderGraph();
  }

  function openHistoryModal(){
    const modal = $("#historyModal");
    if(!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    syncModalOpenClass();
    setHistoryTab(historyTab);
  }

  function closeHistoryModal(){
    const modal = $("#historyModal");
    if(!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    syncModalOpenClass();
    if(historyChart){
      historyChart.destroy();
      historyChart = null;
    }
  }

  function renderEntries(){
    const list = $("#entryList");
    list.innerHTML = "";

    if(state.players.length === 0){
      list.appendChild(el("div", { className: "small", textContent: t("entryNoPlayers") }));
      return;
    }

    const tIdx = turnIndex();
    const changedByAutoFill = autoFillLastWon();
    if(changedByAutoFill) save();

    state.players.forEach((p, idx) => {
      ensureCurrent(state, p.id);
      const cur = state.current[p.id];
      const bidValue = clamp(safeInt(cur.bid), 0, state.round);
      const wonValue = clamp(safeInt(cur.won), 0, state.round);
      const bonusEnabled = bonusAllowed(bidValue, wonValue);
      const piratesMax = Math.min(MAX_PIRATES_BONUS, wonValue);
      const piratesValue = clamp(safeInt(cur.pirates), 0, piratesMax);
      cur.bid = String(bidValue);
      cur.won = String(wonValue);
      cur.pirates = String(piratesValue);
      const rPts = totalRoundPoints(state.round, {
        bid: bidValue,
        won: wonValue,
        pirates: piratesValue,
        mermaid: !!cur.mermaid
      });

      const row = el("div", { className: "entryRow" + (idx === tIdx ? " turn" : "") });

      const top = el("div", { className: "entryTop" });
      top.appendChild(el("div", { className: "pname", textContent: p.name }));
      const scoreMeta = el("div", { className: "scoreMeta" });
      scoreMeta.appendChild(el("div", {
        className: "roundMini",
        textContent: `${t("entryRound")} ${signed(rPts)}`
      }));
      scoreMeta.appendChild(el("div", {
        className: "ptotal",
        textContent: `${t("entryTotal")} ${signed(p.total)}`
      }));
      top.appendChild(scoreMeta);
      row.appendChild(top);

      const inputs = el("div", { className: "inputs" });

      const fBid = el("div", { className: "field rowBid" });
      fBid.appendChild(el("label", { textContent: t("entryBid") }));
      fBid.appendChild(makeNumberButtons({
        min: 0,
        max: state.round,
        selected: bidValue,
        onPick: (v) => {
          cur.bid = String(v);
          save();
          renderEntries();
          renderHistory();
        }
      }));
      inputs.appendChild(fBid);

      const fWon = el("div", { className: "field rowWon" });
      fWon.appendChild(el("label", { textContent: t("entryWon") }));
      fWon.appendChild(makeNumberButtons({
        min: 0,
        max: state.round,
        selected: wonValue,
        onPick: (v) => {
          cur.won = String(v);
          cur.wonTouched = true;
          autoFillLastWon();
          const maxPirates = Math.min(MAX_PIRATES_BONUS, v);
          cur.pirates = String(clamp(safeInt(cur.pirates), 0, maxPirates));
          save();
          renderEntries();
          renderHistory();
        }
      }));
      inputs.appendChild(fWon);

      const bonus = el("div", { className: "bonusRow" });
      const fPir = el("div", { className: "field bonusPirates" });
      fPir.appendChild(el("label", { textContent: t("entryPirates") }));
      fPir.appendChild(makeNumberButtons({
        min: 0,
        max: piratesMax,
        selected: bonusEnabled ? piratesValue : 0,
        disabled: !bonusEnabled,
        onPick: (v) => {
          cur.pirates = String(v);
          save();
          renderEntries();
          renderHistory();
        }
      }));
      bonus.appendChild(fPir);

      const fMer = el("div", { className: "field bonusMermaid" });
      fMer.appendChild(el("label", { textContent: t("entryMermaid") }));
      fMer.appendChild(makeToggleButton({
        active: bonusEnabled && !!cur.mermaid,
        text: t("entryMermaidToggle"),
        disabled: !bonusEnabled,
        onToggle: () => {
          cur.mermaid = !cur.mermaid;
          save();
          renderEntries();
          renderHistory();
        }
      }));
      bonus.appendChild(fMer);
      inputs.appendChild(bonus);

      row.appendChild(inputs);
      list.appendChild(row);
    });
  }

  function makeNumberButtons({ min, max, selected, onPick, disabled = false }){
    max = Math.max(min, max);
    const wrap = el("div", { className: "numPad" + (disabled ? " disabled" : "") });
    wrap.style.setProperty("--num-count", String(max - min + 1));
    for(let v = min; v <= max; v += 1){
      const b = el("button", {
        type: "button",
        className: "numBtn" + (v === selected ? " active" : ""),
        textContent: String(v)
      });
      b.disabled = !!disabled;
      b.onclick = () => onPick(v);
      wrap.appendChild(b);
    }
    return wrap;
  }

  function makeToggleButton({ active, text, onToggle, disabled = false }){
    const b = el("button", {
      type: "button",
      className: "numBtn toggleBtn" + (active ? " active" : ""),
      textContent: text
    });
    b.setAttribute("aria-pressed", active ? "true" : "false");
    b.disabled = !!disabled;
    b.onclick = onToggle;
    return b;
  }

  function renderHistory(){
    const head = $("#histHead");
    const body = $("#histBody");
    head.innerHTML = "";
    body.innerHTML = "";

    const trh = el("tr");
    trh.appendChild(el("th", { textContent: t("histRoundHeader"), style: "min-width:70px;" }));

    state.players.forEach((p) => {
      trh.appendChild(el("th", { className: "right", textContent: p.name }));
    });
    head.appendChild(trh);

    if(state.players.length === 0){
      const tr = el("tr");
      tr.appendChild(el("td", { className: "small", colSpan: 1, textContent: t("histNoHistory") }));
      body.appendChild(tr);
      return;
    }

    if(state.done.length === 0){
      const tr = el("tr");
      tr.appendChild(el("td", {
        className: "small",
        colSpan: 1 + state.players.length,
        textContent: t("histNoCompleted")
      }));
      body.appendChild(tr);
      return;
    }

    state.done.forEach((r) => {
      const tr = el("tr");
      tr.appendChild(el("td", { className: "mono", textContent: String(r.round) }));

      state.players.forEach((p) => {
        const pts = r.entries?.[p.id]?.pts;
        const tot = r.totals?.[p.id];
        const td = el("td", { className: "right" });

        if(typeof pts !== "number" || typeof tot !== "number"){
          td.appendChild(el("div", { className: "cellPts", textContent: t("histMissing") }));
        } else {
          td.appendChild(el("div", {
            className: "cellPts " + (pts >= 0 ? "pos" : "neg"),
            textContent: signed(pts)
          }));
          td.appendChild(el("div", {
            className: "cellTot",
            textContent: `${t("histTotal")} ${signed(tot)}`
          }));
        }

        tr.appendChild(td);
      });

      body.appendChild(tr);
    });
  }

  function renderGraph(){
    const canvas = $("#histGraphCanvas");
    if(!canvas) return;
    if(typeof Chart === "undefined") return;

    if(historyChart){
      historyChart.destroy();
      historyChart = null;
    }

    if(state.players.length === 0 || state.done.length === 0){
      const ctx = canvas.getContext("2d");
      if(!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = Math.max(1, canvas.clientWidth);
      const cssHeight = Math.max(1, canvas.clientHeight);
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.fillStyle = "#9fb0c7";
      ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        state.players.length === 0 ? t("graphNoPlayers") : t("graphNoCompleted"),
        cssWidth / 2,
        cssHeight / 2
      );
      return;
    }

    const labels = state.done.map((r, idx) => String(safeInt(r.round) || (idx + 1)));
    const datasets = state.players.map((p, idx) => {
      const color = playerColor(idx);
      return {
        label: p.name,
        data: state.done.map((r) => {
          const total = r.totals?.[p.id];
          return (typeof total === "number") ? total : null;
        }),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 3,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointHitRadius: 16,
        tension: 0.25,
        spanGaps: true
      };
    });

    const allValues = datasets.flatMap((ds) => ds.data.filter((v) => typeof v === "number"));
    const yMin = allValues.length ? Math.min(0, ...allValues) : 0;
    const yMax = allValues.length ? Math.max(0, ...allValues) : 0;
    const yPadding = Math.max(10, Math.ceil((yMax - yMin) * 0.12));

    const ctx = canvas.getContext("2d");
    if(!ctx) return;
    historyChart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          mode: "nearest",
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              color: "#e7eef9",
              boxWidth: 14,
              boxHeight: 3,
              padding: 14,
              usePointStyle: false,
              font: { size: 11 }
            }
          },
          tooltip: {
            enabled: true
          }
        },
        layout: {
          padding: { left: 6, right: 8, top: 8, bottom: 0 }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: t("graphXAxis"),
              color: "#9fb0c7",
              font: { size: 11, weight: "700" }
            },
            ticks: {
              color: "#9fb0c7",
              autoSkip: true,
              maxTicksLimit: 10,
              maxRotation: 0,
              font: { size: 10 }
            },
            grid: {
              color: "rgba(255,255,255,0.08)"
            },
            border: {
              color: "rgba(255,255,255,0.16)"
            }
          },
          y: {
            suggestedMin: yMin - yPadding,
            suggestedMax: yMax + yPadding,
            title: {
              display: true,
              text: t("graphYAxis"),
              color: "#9fb0c7",
              font: { size: 11, weight: "700" }
            },
            ticks: {
              color: "#9fb0c7",
              precision: 0,
              font: { size: 10 }
            },
            grid: {
              color: "rgba(255,255,255,0.10)"
            },
            border: {
              color: "rgba(255,255,255,0.16)"
            }
          }
        }
      }
    });
  }

  function getSortedArchivedGames(){
    return [...archivedGames].sort((a, b) => archiveSortStamp(b) - archiveSortStamp(a));
  }

  function uniqueArchivedPlayers(games){
    const seen = new Set();
    const names = [];
    for(const game of games){
      for(const name of game.players || []){
        const key = normalizeName(name);
        if(!key || seen.has(key)) continue;
        seen.add(key);
        names.push(name);
      }
    }
    return names;
  }

  function setArchiveTab(tab){
    archiveTab = (tab === "stats") ? "stats" : "games";

    const btnGames = $("#btnTabArchiveGames");
    const btnStats = $("#btnTabArchiveStats");
    const panelGames = $("#tabPanelArchiveGames");
    const panelStats = $("#tabPanelArchiveStats");
    const showingGames = archiveTab === "games";

    if(btnGames){
      btnGames.classList.toggle("active", showingGames);
      btnGames.setAttribute("aria-selected", showingGames ? "true" : "false");
    }
    if(btnStats){
      btnStats.classList.toggle("active", !showingGames);
      btnStats.setAttribute("aria-selected", showingGames ? "false" : "true");
    }
    if(panelGames) panelGames.classList.toggle("hidden", !showingGames);
    if(panelStats) panelStats.classList.toggle("hidden", showingGames);

    if(!showingGames){
      const stats = computePlayerStats(getSortedArchivedGames());
      renderStatsCharts(stats);
    }
  }

  function openArchiveModal(tab = "games"){
    const modal = $("#archiveModal");
    if(!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    syncModalOpenClass();
    renderArchiveModal();
    setArchiveTab(tab);
  }

  function closeArchiveModal(){
    const modal = $("#archiveModal");
    if(!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    destroyStatsCharts();
    syncModalOpenClass();
  }

  function destroyStatsCharts(){
    for(const key of Object.keys(statsCharts)){
      if(statsCharts[key]){
        statsCharts[key].destroy();
        statsCharts[key] = null;
      }
    }
  }

  function renderArchiveModal(){
    const games = getSortedArchivedGames();
    const uniquePlayers = uniqueArchivedPlayers(games).length;
    setText("#archiveSummaryLine", tf("archiveSummaryLine", { games: games.length, players: uniquePlayers }));
    renderArchiveGamesList(games);
    const stats = computePlayerStats(games);
    renderStatsTable(stats);
    populateStatsPlayerSelect(stats);
    if(archiveTab === "stats") renderStatsCharts(stats);
  }

  function renderArchiveGamesList(games){
    const list = $("#archiveGamesList");
    if(!list) return;
    list.innerHTML = "";

    if(games.length === 0){
      list.appendChild(el("div", { className: "small", textContent: t("archiveNoGames") }));
      return;
    }

    for(const game of games){
      const card = el("details", { className: "archiveGameCard" });
      const summary = el("summary", { className: "archiveGameSummary" });
      const top = el("div", { className: "archiveGameSummaryTop" });
      top.appendChild(el("div", {
        className: "archiveGameTitle",
        textContent: `${t("archivePlayedAt")}: ${formatStamp(game.finishedAt || game.updatedAt || game.startedAt)}`
      }));
      top.appendChild(el("div", {
        className: "archiveGameMeta",
        textContent: `${t("archiveRounds")}: ${safeInt(game.roundsPlayed)}`
      }));
      summary.appendChild(top);
      summary.appendChild(el("div", {
        className: "archiveGameMeta",
        textContent: `${t("archivePlayers")}: ${(game.players || []).join(", ")}`
      }));
      card.appendChild(summary);

      const detail = el("div", { className: "archiveGameDetail" });
      const topScore = (game.finalTotals || []).reduce((mx, row) => Math.max(mx, safeInt(row.total)), Number.NEGATIVE_INFINITY);
      detail.appendChild(el("div", {
        className: "archiveStatsLine",
        textContent: `${t("archiveWinners")}: ${(game.winners || []).join(", ") || "-"} | ${t("archiveTopScore")}: ${Number.isFinite(topScore) ? signed(topScore) : "-"}`
      }));

      const rounds = Array.isArray(game.rounds) ? game.rounds : [];
      if(rounds.length > 0){
        const wrap = el("div", { className: "histWrap" });
        const table = el("table");
        const thead = el("thead");
        const tbody = el("tbody");

        const trh = el("tr");
        trh.appendChild(el("th", { textContent: t("archiveRoundHeader"), style: "min-width:70px;" }));
        for(const playerName of (game.players || [])){
          trh.appendChild(el("th", { className: "right", textContent: playerName }));
        }
        thead.appendChild(trh);

        for(const round of rounds){
          const tr = el("tr");
          tr.appendChild(el("td", { className: "mono", textContent: String(safeInt(round.round)) }));

          for(const playerName of (game.players || [])){
            const entry = (round.entries || []).find((e) => normalizeName(e.name) === normalizeName(playerName));
            const td = el("td", { className: "right" });
            if(!entry){
              td.appendChild(el("div", { className: "cellPts", textContent: t("histMissing") }));
            } else {
              td.appendChild(el("div", {
                className: "cellPts " + (safeInt(entry.pts) >= 0 ? "pos" : "neg"),
                textContent: signed(safeInt(entry.pts))
              }));
              td.appendChild(el("div", {
                className: "cellTot",
                textContent: `${t("histTotal")} ${signed(safeInt(entry.total))}`
              }));
            }
            tr.appendChild(td);
          }

          tbody.appendChild(tr);
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        wrap.appendChild(table);
        detail.appendChild(wrap);
      }

      card.appendChild(detail);
      list.appendChild(card);
    }
  }

  function computePlayerStats(games){
    const byPlayer = new Map();

    for(const game of games){
      const totals = Array.isArray(game.finalTotals) ? game.finalTotals : [];
      if(totals.length === 0) continue;

      const sortedTotals = [...totals].sort((a, b) => {
        const diff = safeInt(b.total) - safeInt(a.total);
        return diff !== 0 ? diff : String(a.name || "").localeCompare(String(b.name || ""));
      });

      const winnerNames = (Array.isArray(game.winners) && game.winners.length > 0)
        ? game.winners
        : sortedTotals.filter((row) => safeInt(row.total) === safeInt(sortedTotals[0].total)).map((row) => row.name);
      const winnerSet = new Set(winnerNames.map((name) => normalizeName(name)));
      const rankByPlayer = new Map();

      let prevScore = null;
      let currentRank = 0;
      for(let i = 0; i < sortedTotals.length; i += 1){
        const row = sortedTotals[i];
        const score = safeInt(row.total);
        if(prevScore === null || score < prevScore){
          currentRank = i + 1;
          prevScore = score;
        }
        rankByPlayer.set(normalizeName(row.name), currentRank);
      }

      const stamp = archiveSortStamp(game);
      for(const row of totals){
        const name = String(row.name || "").trim();
        const key = normalizeName(name);
        if(!key) continue;
        const score = safeInt(row.total);

        if(!byPlayer.has(key)){
          byPlayer.set(key, {
            key,
            name,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            totalPoints: 0,
            maxPoints: Number.NEGATIVE_INFINITY,
            minPoints: Number.POSITIVE_INFINITY,
            rankSum: 0,
            scoreHistory: [],
            positionCounts: {}
          });
        }

        const stat = byPlayer.get(key);
        stat.name = name;
        stat.gamesPlayed += 1;
        stat.totalPoints += score;
        stat.maxPoints = Math.max(stat.maxPoints, score);
        stat.minPoints = Math.min(stat.minPoints, score);

        const isWinner = winnerSet.has(key);
        if(isWinner) stat.wins += 1;
        else stat.losses += 1;

        const rank = rankByPlayer.get(key) || sortedTotals.length;
        stat.rankSum += rank;
        stat.scoreHistory.push({ stamp, score });
        stat.positionCounts[rank] = safeInt(stat.positionCounts[rank]) + 1;
      }
    }

    const stats = [...byPlayer.values()].map((s) => {
      const gamesPlayed = Math.max(1, s.gamesPlayed);
      return {
        ...s,
        avgPoints: s.totalPoints / gamesPlayed,
        avgRank: s.rankSum / gamesPlayed,
        winRate: (s.wins / gamesPlayed) * 100
      };
    });

    stats.sort((a, b) => {
      const gameDiff = b.gamesPlayed - a.gamesPlayed;
      if(gameDiff !== 0) return gameDiff;
      const winDiff = b.wins - a.wins;
      if(winDiff !== 0) return winDiff;
      return b.avgPoints - a.avgPoints;
    });

    return stats;
  }

  function populateStatsPlayerSelect(stats){
    const select = $("#statsPlayerSelect");
    if(!select) return;

    const keys = new Set(stats.map((s) => s.key));
    if(!statsSelectedPlayer || !keys.has(statsSelectedPlayer)){
      statsSelectedPlayer = stats[0]?.key || "";
    }

    select.innerHTML = "";
    for(const stat of stats){
      select.appendChild(el("option", {
        value: stat.key,
        textContent: stat.name
      }));
    }
    if(statsSelectedPlayer) select.value = statsSelectedPlayer;
  }

  function renderStatsTable(stats){
    const head = $("#statsHead");
    const body = $("#statsBody");
    if(!head || !body) return;

    head.innerHTML = "";
    body.innerHTML = "";

    const trh = el("tr");
    trh.appendChild(el("th", { textContent: t("statsHeaderPlayer"), style: "min-width:140px;" }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderGames") }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderWon") }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderLost") }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderWinRate") }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderMax") }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderAvg") }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderMin") }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderTotal") }));
    trh.appendChild(el("th", { className: "right", textContent: t("statsHeaderAvgRank") }));
    head.appendChild(trh);

    if(stats.length === 0){
      const tr = el("tr");
      tr.appendChild(el("td", {
        className: "small",
        colSpan: 10,
        textContent: t("statsNoData")
      }));
      body.appendChild(tr);
      return;
    }

    for(const stat of stats){
      const tr = el("tr");
      tr.appendChild(el("td", { className: "mono", textContent: stat.name }));
      tr.appendChild(el("td", { className: "right mono", textContent: String(stat.gamesPlayed) }));
      tr.appendChild(el("td", { className: "right mono pos", textContent: String(stat.wins) }));
      tr.appendChild(el("td", { className: "right mono neg", textContent: String(stat.losses) }));
      tr.appendChild(el("td", { className: "right mono", textContent: `${stat.winRate.toFixed(1)}%` }));
      tr.appendChild(el("td", { className: "right mono", textContent: signed(stat.maxPoints) }));
      tr.appendChild(el("td", { className: "right mono", textContent: signed(Math.round(stat.avgPoints * 10) / 10) }));
      tr.appendChild(el("td", { className: "right mono", textContent: signed(stat.minPoints) }));
      tr.appendChild(el("td", { className: "right mono", textContent: signed(stat.totalPoints) }));
      tr.appendChild(el("td", { className: "right mono", textContent: stat.avgRank.toFixed(2) }));
      body.appendChild(tr);
    }
  }

  function drawCanvasMessage(canvas, message){
    const ctx = canvas?.getContext("2d");
    if(!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(1, canvas.clientWidth || 400);
    const cssHeight = Math.max(1, canvas.clientHeight || 220);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.fillStyle = "#9fb0c7";
    ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, cssWidth / 2, cssHeight / 2);
  }

  function chartBaseOptions(){
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#e7eef9",
            padding: 10,
            boxWidth: 12,
            boxHeight: 3,
            font: { size: 11 }
          }
        }
      }
    };
  }

  function renderStatsCharts(stats){
    destroyStatsCharts();
    if(typeof Chart === "undefined") return;

    const winLossCanvas = $("#statsWinLossCanvas");
    const pointsCanvas = $("#statsPointsCanvas");
    const trendCanvas = $("#statsTrendCanvas");
    const positionCanvas = $("#statsPositionCanvas");
    const canvases = [winLossCanvas, pointsCanvas, trendCanvas, positionCanvas];

    if(stats.length === 0){
      for(const canvas of canvases) drawCanvasMessage(canvas, t("statsNoData"));
      return;
    }

    const labels = stats.map((s) => s.name);
    const colors = stats.map((_, idx) => playerColor(idx));

    statsCharts.winLoss = new Chart(winLossCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: t("statsHeaderWon"), data: stats.map((s) => s.wins), backgroundColor: "rgba(52,211,153,.75)" },
          { label: t("statsHeaderLost"), data: stats.map((s) => s.losses), backgroundColor: "rgba(251,113,133,.75)" }
        ]
      },
      options: {
        ...chartBaseOptions(),
        plugins: {
          ...chartBaseOptions().plugins,
          title: {
            display: true,
            text: t("statsChartWinLoss"),
            color: "#9fb0c7",
            font: { size: 12, weight: "700" }
          }
        },
        scales: {
          x: {
            ticks: { color: "#9fb0c7", font: { size: 10 } },
            grid: { color: "rgba(255,255,255,.08)" }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: t("statsAxisGames"),
              color: "#9fb0c7",
              font: { size: 11, weight: "700" }
            },
            ticks: { color: "#9fb0c7", precision: 0, font: { size: 10 } },
            grid: { color: "rgba(255,255,255,.10)" }
          }
        }
      }
    });

    statsCharts.points = new Chart(pointsCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: t("statsHeaderMin"), data: stats.map((s) => s.minPoints), backgroundColor: "rgba(125,211,252,.62)" },
          { label: t("statsHeaderAvg"), data: stats.map((s) => Number(s.avgPoints.toFixed(2))), backgroundColor: "rgba(244,197,66,.70)" },
          { label: t("statsHeaderMax"), data: stats.map((s) => s.maxPoints), backgroundColor: "rgba(52,211,153,.72)" }
        ]
      },
      options: {
        ...chartBaseOptions(),
        plugins: {
          ...chartBaseOptions().plugins,
          title: {
            display: true,
            text: t("statsChartPoints"),
            color: "#9fb0c7",
            font: { size: 12, weight: "700" }
          }
        },
        scales: {
          x: {
            ticks: { color: "#9fb0c7", font: { size: 10 } },
            grid: { color: "rgba(255,255,255,.08)" }
          },
          y: {
            title: {
              display: true,
              text: t("statsAxisPoints"),
              color: "#9fb0c7",
              font: { size: 11, weight: "700" }
            },
            ticks: { color: "#9fb0c7", precision: 0, font: { size: 10 } },
            grid: { color: "rgba(255,255,255,.10)" }
          }
        }
      }
    });

    const selected = stats.find((s) => s.key === statsSelectedPlayer) || stats[0];
    if(selected) statsSelectedPlayer = selected.key;

    if(!selected || selected.scoreHistory.length === 0){
      drawCanvasMessage(trendCanvas, t("statsNoData"));
      drawCanvasMessage(positionCanvas, t("statsNoData"));
      return;
    }

    const scoreHistory = [...selected.scoreHistory].sort((a, b) => a.stamp - b.stamp);
    const historyLabels = scoreHistory.map((pt) => formatStamp(pt.stamp));
    const historyScores = scoreHistory.map((pt) => pt.score);

    statsCharts.trend = new Chart(trendCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: historyLabels,
        datasets: [{
          label: selected.name,
          data: historyScores,
          borderColor: playerColor(0),
          backgroundColor: playerColor(0),
          borderWidth: 3,
          pointRadius: 2.5,
          tension: 0.25
        }]
      },
      options: {
        ...chartBaseOptions(),
        plugins: {
          ...chartBaseOptions().plugins,
          title: {
            display: true,
            text: `${t("statsChartTrend")} - ${selected.name}`,
            color: "#9fb0c7",
            font: { size: 12, weight: "700" }
          }
        },
        scales: {
          x: {
            ticks: { color: "#9fb0c7", autoSkip: true, maxTicksLimit: 6, font: { size: 10 } },
            grid: { color: "rgba(255,255,255,.08)" }
          },
          y: {
            title: {
              display: true,
              text: t("statsAxisPoints"),
              color: "#9fb0c7",
              font: { size: 11, weight: "700" }
            },
            ticks: { color: "#9fb0c7", precision: 0, font: { size: 10 } },
            grid: { color: "rgba(255,255,255,.10)" }
          }
        }
      }
    });

    const rankPairs = Object.entries(selected.positionCounts)
      .map(([rank, count]) => ({ rank: safeInt(rank), count: safeInt(count) }))
      .sort((a, b) => a.rank - b.rank);
    const posLabels = rankPairs.map((item) => `${t("statsPositionPrefix")} ${item.rank}`);
    const posValues = rankPairs.map((item) => item.count);
    const posColors = rankPairs.map((_, idx) => colors[idx % colors.length]);

    statsCharts.positions = new Chart(positionCanvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: posLabels,
        datasets: [{
          label: t("statsChartPositions"),
          data: posValues,
          backgroundColor: posColors,
          borderColor: "rgba(255,255,255,.12)",
          borderWidth: 1
        }]
      },
      options: {
        ...chartBaseOptions(),
        plugins: {
          ...chartBaseOptions().plugins,
          title: {
            display: true,
            text: `${t("statsChartPositions")} - ${selected.name}`,
            color: "#9fb0c7",
            font: { size: 12, weight: "700" }
          }
        }
      }
    });
  }

  function addPlayer(name){
    name = (name || "").trim();
    if(!name) return;
    if(state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return;

    const p = { id: uid(), name, total: 0 };
    state.players.push(p);
    ensureCurrent(state, p.id);

    $("#playerName").value = "";
    save();
    render();
  }

  function removePlayerSetup(pid){
    state.players = state.players.filter((p) => p.id !== pid);
    delete state.current[pid];
    save();
    render();
  }

  function movePlayer(index, delta){
    const j = index + delta;
    if(j < 0 || j >= state.players.length) return;
    const a = state.players[index];
    state.players[index] = state.players[j];
    state.players[j] = a;
    save();
    render();
  }

  function startGame(){
    if(state.players.length === 0){
      alert(t("alertAddPlayer"));
      return;
    }

    for(const p of state.players) p.total = 0;
    state.done = [];
    state.round = 1;
    state.sessionId = uid();
    state.startedAt = nowIso();
    state.current = {};
    for(const p of state.players) ensureCurrent(state, p.id);

    state.mode = "game";
    save();
    render();
  }

  function newGame(){
    if(!confirm(t("confirmNewGame"))) return;
    if(state.mode === "game" && state.done.length > 0) upsertArchiveFromState();
    state = structuredClone(DEFAULT);
    save();
    render();
  }

  function roundDone(){
    if(state.players.length === 0) return;

    const rec = { round: state.round, entries: {}, totals: {} };

    for(const p of state.players){
      ensureCurrent(state, p.id);
      const cur = state.current[p.id];

      const entry = { bid: cur.bid, won: cur.won, pirates: cur.pirates, mermaid: cur.mermaid };
      const bonusApplies = bonusAllowed(entry.bid, entry.won);
      const pirates = bonusApplies ? clamp(safeInt(entry.pirates), 0, MAX_PIRATES_BONUS) : 0;
      const mermaid = bonusApplies ? !!entry.mermaid : false;
      const scored = { bid: entry.bid, won: entry.won, pirates, mermaid };
      const pts = totalRoundPoints(state.round, scored);

      p.total += pts;

      rec.entries[p.id] = {
        bid: clamp(safeInt(entry.bid), 0, state.round),
        won: clamp(safeInt(entry.won), 0, state.round),
        pirates,
        mermaid,
        pts
      };
      rec.totals[p.id] = p.total;
    }

    state.done.push(rec);

    state.round += 1;
    state.current = {};
    for(const p of state.players) ensureCurrent(state, p.id);

    upsertArchiveFromState();
    save();
    render();
  }

  $("#btnAdd").onclick = () => addPlayer($("#playerName").value);
  $("#playerName").addEventListener("keydown", (e) => {
    if(e.key === "Enter") addPlayer($("#playerName").value);
  });

  $("#languageSelect").addEventListener("change", (e) => setLanguage(e.target.value));
  $("#btnSetupHistory").onclick = () => openArchiveModal("games");
  $("#btnSetupStats").onclick = () => openArchiveModal("stats");

  $("#btnStart").onclick = startGame;
  $("#btnNewGame").onclick = newGame;
  $("#btnDone").onclick = roundDone;
  $("#btnHistory").onclick = openHistoryModal;
  $("#btnTabHistory").onclick = () => setHistoryTab("history");
  $("#btnTabGraph").onclick = () => setHistoryTab("graph");
  $("#btnCloseHistory").onclick = closeHistoryModal;
  $("#historyModal").addEventListener("click", (e) => {
    if(e.target.id === "historyModal") closeHistoryModal();
  });
  $("#btnTabArchiveGames").onclick = () => setArchiveTab("games");
  $("#btnTabArchiveStats").onclick = () => setArchiveTab("stats");
  $("#btnCloseArchive").onclick = closeArchiveModal;
  $("#archiveModal").addEventListener("click", (e) => {
    if(e.target.id === "archiveModal") closeArchiveModal();
  });
  $("#statsPlayerSelect").addEventListener("change", (e) => {
    statsSelectedPlayer = String(e.target.value || "");
    if(archiveTab === "stats" && !$("#archiveModal").classList.contains("hidden")){
      const stats = computePlayerStats(getSortedArchivedGames());
      renderStatsCharts(stats);
    }
  });
  window.addEventListener("keydown", (e) => {
    if(e.key !== "Escape") return;
    closeHistoryModal();
    closeArchiveModal();
  });

  render();

  window.addEventListener("resize", () => {
    if(state.mode === "game"){
      renderEntries();
      if(historyTab === "graph" && !$("#historyModal").classList.contains("hidden")) renderGraph();
    }
    if(archiveTab === "stats" && !$("#archiveModal").classList.contains("hidden")){
      const stats = computePlayerStats(getSortedArchivedGames());
      renderStatsCharts(stats);
    }
  });
})();
