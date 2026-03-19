(() => {
  const KEY = "skullking_mobile_v1";
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
      entryMermaidToggle: "Meerjungfrau schlug SK",
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

  let language = loadLanguage();
  let historyTab = "history";
  let historyChart = null;

  const DEFAULT = {
    mode: "setup",
    round: 1,
    players: [],
    current: {},
    done: []
  };

  let state = load();

  function t(key){
    const table = I18N[language] || I18N.en;
    if(Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    if(Object.prototype.hasOwnProperty.call(I18N.en, key)) return I18N.en[key];
    return key;
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

      return s;
    } catch {
      return structuredClone(DEFAULT);
    }
  }

  function save(){
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function setText(selector, value){
    const node = $(selector);
    if(node) node.textContent = value;
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
    setText("#roundPillText", t("gameRound"));
    setText("#btnNewGame", t("gameNewGame"));
    setText("#btnHistory", t("gameHistory"));
    setText("#btnDone", t("gameRoundDone"));
    setText("#historyTitle", t("historyTitle"));
    setText("#btnCloseHistory", t("historyClose"));
    setText("#btnTabHistory", t("historyTabHistory"));
    setText("#btnTabGraph", t("historyTabGraph"));

    const input = $("#playerName");
    if(input) input.placeholder = t("setupPlayerPlaceholder");

    const historyTabs = $("#historyTabs");
    if(historyTabs) historyTabs.setAttribute("aria-label", t("historyViewsAriaLabel"));

    const graphCanvas = $("#histGraphCanvas");
    if(graphCanvas) graphCanvas.setAttribute("aria-label", t("historyGraphAriaLabel"));

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
  }

  function renderSetup(){
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
    document.body.classList.add("modalOpen");
    setHistoryTab(historyTab);
  }

  function closeHistoryModal(){
    const modal = $("#historyModal");
    if(!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modalOpen");
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
        className: "ptotal",
        textContent: `${t("entryTotal")} ${signed(p.total)}`
      }));
      scoreMeta.appendChild(el("div", {
        className: "roundMini " + (rPts >= 0 ? "pos" : "neg"),
        textContent: `${t("entryRound")} ${signed(rPts)}`
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
    state.current = {};
    for(const p of state.players) ensureCurrent(state, p.id);

    state.mode = "game";
    save();
    render();
  }

  function newGame(){
    if(!confirm(t("confirmNewGame"))) return;
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

    save();
    render();
  }

  $("#btnAdd").onclick = () => addPlayer($("#playerName").value);
  $("#playerName").addEventListener("keydown", (e) => {
    if(e.key === "Enter") addPlayer($("#playerName").value);
  });

  $("#languageSelect").addEventListener("change", (e) => setLanguage(e.target.value));

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
  window.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeHistoryModal();
  });

  render();

  window.addEventListener("resize", () => {
    if(state.mode !== "game") return;
    renderEntries();
    if(historyTab === "graph" && !$("#historyModal").classList.contains("hidden")) renderGraph();
  });
})();
