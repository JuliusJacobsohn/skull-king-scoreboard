(() => {
  const KEY = "skullking_mobile_v1";

  const $ = (s) => document.querySelector(s);
  const el = (t, p={}) => Object.assign(document.createElement(t), p);
  const safeInt = (v) => Number.isFinite(parseInt(v,10)) ? parseInt(v,10) : 0;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const MAX_PIRATES_BONUS = 6;
  const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : (Date.now().toString(36)+Math.random().toString(36).slice(2)));

  const DEFAULT = {
    mode: "setup",      // "setup" | "game"
    round: 1,
    players: [],        // {id,name,total}
    current: {},        // pid -> {bid:"0", won:"0", pirates:"0", mermaid:false}
    done: []            // {round, entries:{pid:{bid,won,pirates,mermaid,pts}}, totals:{pid:totalAfter}}
  };

  let state = load();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return structuredClone(DEFAULT);
      const s = Object.assign(structuredClone(DEFAULT), JSON.parse(raw));

      s.mode = (s.mode === "game") ? "game" : "setup";
      s.round = Math.max(1, safeInt(s.round));

      s.players = Array.isArray(s.players)
        ? s.players.map(p => ({
            id: String(p.id || uid()),
            name: String(p.name || "Player").trim(),
            total: safeInt(p.total)
          })).filter(p => p.name)
        : [];

      s.current = (s.current && typeof s.current === "object") ? s.current : {};
      s.done = Array.isArray(s.done) ? s.done : [];

      // normalize current defaults
      for(const p of s.players) ensureCurrent(s, p.id);

      return s;
    }catch{
      return structuredClone(DEFAULT);
    }
  }

  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }

  function ensureCurrent(s, pid){
    if(!s.current[pid]){
      s.current[pid] = { bid:"0", won:"0", pirates:"0", mermaid:false };
      return;
    }
    const c = s.current[pid];
    if(c.bid === undefined || c.bid === "") c.bid = "0";
    if(c.won === undefined || c.won === "") c.won = "0";
    if(c.pirates === undefined || c.pirates === "") c.pirates = "0";
    if(typeof c.mermaid !== "boolean") c.mermaid = !!c.mermaid;
  }

  function turnIndex(){
    if(state.players.length === 0) return -1;
    return (state.round - 1) % state.players.length;
  }

  function basePointsFor(round, bid, won){
    bid = safeInt(bid); won = safeInt(won);
    if(bid === 0) return (won === 0) ? (10 * round) : (-10 * round);
    return (won === bid) ? (20 * bid) : (-10 * Math.abs(bid - won));
  }

  function hitTarget(bid, won){
    return safeInt(bid) === safeInt(won);
  }

  function totalRoundPoints(round, entry){
    const base = basePointsFor(round, entry.bid, entry.won);
    const allowBonus = hitTarget(entry.bid, entry.won);
    const pirates = allowBonus ? clamp(safeInt(entry.pirates), 0, MAX_PIRATES_BONUS) : 0;
    const mermaid = allowBonus ? !!entry.mermaid : false;
    return base + (pirates * 30) + (mermaid ? 50 : 0);
  }

  function render(){
    // screen toggle
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
      chips.appendChild(el("div", { className:"small", textContent:"No players yet." }));
    } else {
      state.players.forEach((p, idx) => {
        const c = el("div", { className:"chip" });
        c.appendChild(el("span", { textContent:p.name }));

        const up = el("button", { textContent:"↑", title:"Move up" });
        up.onclick = () => movePlayer(idx, -1);

        const dn = el("button", { textContent:"↓", title:"Move down" });
        dn.onclick = () => movePlayer(idx, +1);

        const del = el("button", { className:"btnDanger", textContent:"×", title:"Remove" });
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

    // Leader line
    const sorted = [...state.players].sort((a,b) => (b.total - a.total));
    const top = sorted.slice(0, Math.min(3, sorted.length))
      .map(p => `${p.name} ${(p.total>=0?"+":"")}${p.total}`)
      .join(" • ");
    $("#leaderLine").textContent = top ? top : "";

    renderEntries();
    renderHistory();
  }

  function openHistoryModal(){
    const modal = $("#historyModal");
    if(!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modalOpen");
  }

  function closeHistoryModal(){
    const modal = $("#historyModal");
    if(!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modalOpen");
  }

  function renderEntries(){
    const list = $("#entryList");
    list.innerHTML = "";

    if(state.players.length === 0){
      list.appendChild(el("div", { className:"small", textContent:"No players." }));
      return;
    }

    const tIdx = turnIndex();

    state.players.forEach((p, idx) => {
      ensureCurrent(state, p.id);
      const cur = state.current[p.id];
      const bidValue = clamp(safeInt(cur.bid), 0, state.round);
      const wonValue = clamp(safeInt(cur.won), 0, state.round);
      const bonusEnabled = hitTarget(bidValue, wonValue);
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

      const row = el("div", { className:"entryRow" + (idx === tIdx ? " turn" : "") });

      const top = el("div", { className:"entryTop" });
      top.appendChild(el("div", { className:"pname", textContent:p.name }));
      const scoreMeta = el("div", { className:"scoreMeta" });
      scoreMeta.appendChild(el("div", { className:"ptotal", innerHTML:`Total&nbsp;${(p.total>=0?"+":"")}${p.total}` }));
      scoreMeta.appendChild(el("div", {
        className:"roundMini " + (rPts >= 0 ? "pos" : "neg"),
        textContent: `Round ${(rPts>=0?"+":"")}${rPts}`
      }));
      top.appendChild(scoreMeta);
      row.appendChild(top);

      const inputs = el("div", { className:"inputs" });

      // Bid
      const fBid = el("div", { className:"field rowBid" });
      fBid.appendChild(el("label", { textContent:"Bid" }));
      fBid.appendChild(makeNumberButtons({
        min: 0,
        max: state.round,
        selected: bidValue,
        onPick: (v) => {
          cur.bid = String(v);
          save(); renderEntries(); renderHistory();
        }
      }));
      inputs.appendChild(fBid);

      // Won
      const fWon = el("div", { className:"field rowWon" });
      fWon.appendChild(el("label", { textContent:"Won" }));
      fWon.appendChild(makeNumberButtons({
        min: 0,
        max: state.round,
        selected: wonValue,
        onPick: (v) => {
          cur.won = String(v);
          const maxPirates = Math.min(MAX_PIRATES_BONUS, v);
          cur.pirates = String(clamp(safeInt(cur.pirates), 0, maxPirates));
          save(); renderEntries(); renderHistory();
        }
      }));
      inputs.appendChild(fWon);

      // Bonus
      const bonus = el("div", { className:"bonusRow" });
      const fPir = el("div", { className:"field bonusPirates" });
      fPir.appendChild(el("label", { textContent:"Pirates (+30)" }));
      fPir.appendChild(makeNumberButtons({
        min: 0,
        max: piratesMax,
        selected: bonusEnabled ? piratesValue : 0,
        disabled: !bonusEnabled,
        onPick: (v) => {
          cur.pirates = String(v);
          save(); renderEntries(); renderHistory();
        }
      }));
      bonus.appendChild(fPir);

      const fMer = el("div", { className:"field bonusMermaid" });
      fMer.appendChild(el("label", { textContent:"Mermaid (+50)" }));
      fMer.appendChild(makeToggleButton({
        active: bonusEnabled && !!cur.mermaid,
        text: "Mermaid beat SK",
        disabled: !bonusEnabled,
        onToggle: () => {
          cur.mermaid = !cur.mermaid;
          save(); renderEntries(); renderHistory();
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
    const wrap = el("div", { className:"numPad" + (disabled ? " disabled" : "") });
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
    trh.appendChild(el("th", { textContent:"Round", style:"min-width:70px;" }));

    state.players.forEach(p => {
      trh.appendChild(el("th", { className:"right", textContent:p.name }));
    });
    head.appendChild(trh);

    if(state.players.length === 0){
      const tr = el("tr");
      tr.appendChild(el("td", { className:"small", colSpan: 1, textContent:"No history." }));
      body.appendChild(tr);
      return;
    }

    if(state.done.length === 0){
      const tr = el("tr");
      tr.appendChild(el("td", { className:"small", colSpan: 1 + state.players.length, textContent:"No completed rounds yet." }));
      body.appendChild(tr);
      return;
    }

    // Each row: show pts and total after that round for each player
    state.done.forEach(r => {
      const tr = el("tr");
      tr.appendChild(el("td", { className:"mono", textContent:String(r.round) }));

      state.players.forEach(p => {
        const pts = r.entries?.[p.id]?.pts;
        const tot = r.totals?.[p.id];
        const td = el("td", { className:"right" });

        if(typeof pts !== "number" || typeof tot !== "number"){
          td.appendChild(el("div", { className:"cellPts", textContent:"—" }));
        } else {
          td.appendChild(el("div", {
            className:"cellPts " + (pts>=0 ? "pos":"neg"),
            textContent: (pts>=0?"+":"") + pts
          }));
          td.appendChild(el("div", {
            className:"cellTot",
            textContent: "Total " + (tot>=0?"+":"") + tot
          }));
        }

        tr.appendChild(td);
      });

      body.appendChild(tr);
    });
  }

  function addPlayer(name){
    name = (name || "").trim();
    if(!name) return;
    if(state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) return;

    const p = { id: uid(), name, total: 0 };
    state.players.push(p);
    ensureCurrent(state, p.id);

    $("#playerName").value = "";
    save(); render();
  }

  function removePlayerSetup(pid){
    state.players = state.players.filter(p => p.id !== pid);
    delete state.current[pid];
    save(); render();
  }

  function movePlayer(index, delta){
    const j = index + delta;
    if(j < 0 || j >= state.players.length) return;
    const a = state.players[index];
    state.players[index] = state.players[j];
    state.players[j] = a;
    save(); render();
  }

  function startGame(){
    if(state.players.length === 0){
      alert("Add at least one player.");
      return;
    }
    // reset round inputs to 0 (pre-entered) but keep any existing totals/history if resuming is desired
    // For a clean start, also clear totals/history:
    for(const p of state.players) p.total = 0;
    state.done = [];
    state.round = 1;
    state.current = {};
    for(const p of state.players) ensureCurrent(state, p.id);

    state.mode = "game";
    save(); render();
  }

  function newGame(){
    // Return to player manage screen (setup) and clear everything.
    if(!confirm("Start a new game? This will delete all players and history.")) return;
    state = structuredClone(DEFAULT);
    save(); render();
  }

  function roundDone(){
    if(state.players.length === 0) return;

    const rec = { round: state.round, entries: {}, totals: {} };

    for(const p of state.players){
      ensureCurrent(state, p.id);
      const cur = state.current[p.id];

      const entry = { bid:cur.bid, won:cur.won, pirates:cur.pirates, mermaid:cur.mermaid };
      const bonusApplies = hitTarget(entry.bid, entry.won);
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

    // next round; reset inputs to 0
    state.round += 1;
    state.current = {};
    for(const p of state.players) ensureCurrent(state, p.id);

    save(); render();
  }

  // Wiring
  $("#btnAdd").onclick = () => addPlayer($("#playerName").value);
  $("#playerName").addEventListener("keydown", (e) => { if(e.key === "Enter") addPlayer($("#playerName").value); });

  $("#btnStart").onclick = startGame;
  $("#btnNewGame").onclick = newGame;
  $("#btnDone").onclick = roundDone;
  $("#btnHistory").onclick = openHistoryModal;
  $("#btnCloseHistory").onclick = closeHistoryModal;
  $("#historyModal").addEventListener("click", (e) => { if(e.target.id === "historyModal") closeHistoryModal(); });
  window.addEventListener("keydown", (e) => { if(e.key === "Escape") closeHistoryModal(); });

  // Initial render
  render();

  // Re-render on breakpoint change
  window.addEventListener("resize", () => { if(state.mode === "game") renderEntries(); });

})();
