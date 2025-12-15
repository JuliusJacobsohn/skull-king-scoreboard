(() => {
  const KEY = "skullking_mobile_v1";

  const $ = (s) => document.querySelector(s);
  const el = (t, p={}) => Object.assign(document.createElement(t), p);
  const safeInt = (v) => Number.isFinite(parseInt(v,10)) ? parseInt(v,10) : 0;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const isDesktop = () => window.matchMedia("(min-width: 900px)").matches;
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

  function totalRoundPoints(round, entry){
    const base = basePointsFor(round, entry.bid, entry.won);
    const pirates = Math.max(0, safeInt(entry.pirates));
    const mermaid = !!entry.mermaid;
    return base + (pirates * 30) + (mermaid ? 50 : 0);
  }

  function render(){
    // top pills
    $("#roundLabelTop").textContent = String(state.round);

    // screen toggle
    const setup = $("#setupScreen");
    const game = $("#gameScreen");
    if(state.mode === "setup"){
      setup.classList.remove("hidden");
      game.classList.add("hidden");
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

      const entry = { bid:cur.bid, won:cur.won, pirates:cur.pirates, mermaid:cur.mermaid };
      const rPts = totalRoundPoints(state.round, entry);

      const row = el("div", { className:"entryRow" + (idx === tIdx ? " turn" : "") });

      const top = el("div", { className:"entryTop" });
      top.appendChild(el("div", { className:"pname", textContent:p.name }));
      top.appendChild(el("div", { className:"ptotal", innerHTML:`Total&nbsp;${(p.total>=0?"+":"")}${p.total}` }));
      row.appendChild(top);

      const inputs = el("div", { className:"inputs" });

      // Bid
      const fBid = el("div", { className:"field" });
      fBid.appendChild(el("label", { textContent:"Bid" }));
      const inBid = el("input", {
        type:"number", min:"0", max:String(state.round), step:"1",
        value:String(cur.bid ?? "0"), inputMode:"numeric",
        "data-col":"bid", "data-idx": String(idx), "data-pid": p.id
      });
      inBid.oninput = () => {
        const v = inBid.value;
        cur.bid = String(clamp(safeInt(v), 0, state.round));
        save(); renderEntries(); renderHistory(); // keep snappy
      };
      fBid.appendChild(inBid);
      inputs.appendChild(fBid);

      // Won
      const fWon = el("div", { className:"field" });
      fWon.appendChild(el("label", { textContent:"Won" }));
      const inWon = el("input", {
        type:"number", min:"0", max:String(state.round), step:"1",
        value:String(cur.won ?? "0"), inputMode:"numeric",
        "data-col":"won", "data-idx": String(idx), "data-pid": p.id
      });
      inWon.oninput = () => {
        const v = inWon.value;
        cur.won = String(clamp(safeInt(v), 0, state.round));
        save(); renderEntries(); renderHistory();
      };
      fWon.appendChild(inWon);
      inputs.appendChild(fWon);

      // Pirates
      const fPir = el("div", { className:"field" });
      fPir.appendChild(el("label", { textContent:"Pirates (+30)" }));
      const inPir = el("input", {
        type:"number", min:"0", step:"1",
        value:String(cur.pirates ?? "0"), inputMode:"numeric",
        className:"smallNum",
        "data-col":"pirates", "data-idx": String(idx), "data-pid": p.id
      });
      inPir.oninput = () => {
        const v = inPir.value;
        cur.pirates = String(Math.max(0, safeInt(v)));
        save(); renderEntries(); renderHistory();
      };
      fPir.appendChild(inPir);
      inputs.appendChild(fPir);

      // Mermaid
      const fMer = el("div", { className:"field" });
      fMer.appendChild(el("label", { textContent:"Mermaid (+50)" }));
      const inline = el("div", { className:"inline" });
      inline.appendChild(el("div", { className:"small", textContent:"Beats Skull King" }));
      const cb = el("input", {
        type:"checkbox",
        checked: !!cur.mermaid,
        "data-col":"mermaid", "data-idx": String(idx), "data-pid": p.id
      });
      cb.onchange = () => {
        cur.mermaid = cb.checked;
        save(); renderEntries(); renderHistory();
      };
      inline.appendChild(cb);
      fMer.appendChild(inline);
      inputs.appendChild(fMer);

      // Round points line
      const rp = el("div", { className:"roundPts" });
      rp.appendChild(el("div", { className:"small", textContent: (idx===tIdx ? "Your turn" : " ") }));
      rp.appendChild(el("div", { className:"cellPts " + (rPts>=0 ? "pos":"neg"), textContent: `Round ${(rPts>=0?"+":"")}${rPts}` }));
      inputs.appendChild(rp);

      row.appendChild(inputs);
      list.appendChild(row);
    });

    // Desktop tab behavior: bid→bid→… then won→won→…
    wireTabbing();
  }

  function wireTabbing(){
    // Only override on desktop; mobile should use default.
    if(!isDesktop()) return;

    const inputs = [...document.querySelectorAll('#entryList input[type="number"], #entryList input[type="checkbox"]')];
    const by = (col) => inputs.filter(x => x.dataset.col === col).sort((a,b) => safeInt(a.dataset.idx) - safeInt(b.dataset.idx));

    const bids = by("bid");
    const wons = by("won");
    const pirs = by("pirates");
    const mers = by("mermaid");

    const focus = (arr, i) => { if(arr[i]) arr[i].focus(); };

    function handler(e){
      if(e.key !== "Tab") return;
      const col = e.target.dataset.col;
      const idx = safeInt(e.target.dataset.idx);
      const shift = e.shiftKey;

      const n = state.players.length;
      if(n <= 0) return;

      // Only handle within the round-entry inputs
      if(!["bid","won","pirates","mermaid"].includes(col)) return;

      // Forward tab
      if(!shift){
        e.preventDefault();
        if(col === "bid"){
          return (idx < n-1) ? focus(bids, idx+1) : focus(wons, 0);
        }
        if(col === "won"){
          return (idx < n-1) ? focus(wons, idx+1) : focus(pirs, 0);
        }
        if(col === "pirates"){
          return (idx < n-1) ? focus(pirs, idx+1) : focus(mers, 0);
        }
        if(col === "mermaid"){
          // last cycle: move to Round done button
          if(idx < n-1) return focus(mers, idx+1);
          $("#btnDone").focus();
          return;
        }
      }

      // Backward (Shift+Tab)
      e.preventDefault();
      if(col === "bid"){
        // go to previous bid, else to New game
        return (idx > 0) ? focus(bids, idx-1) : $("#btnNewGame").focus();
      }
      if(col === "won"){
        return (idx > 0) ? focus(wons, idx-1) : focus(bids, n-1);
      }
      if(col === "pirates"){
        return (idx > 0) ? focus(pirs, idx-1) : focus(wons, n-1);
      }
      if(col === "mermaid"){
        return (idx > 0) ? focus(mers, idx-1) : focus(pirs, n-1);
      }
    }

    // Add keydown listener (capture) once at container level
    const container = $("#entryList");
    if(!container._tabWired){
      container.addEventListener("keydown", handler, true);
      container._tabWired = true;
    }
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
      const pts = totalRoundPoints(state.round, entry);

      p.total += pts;

      rec.entries[p.id] = {
        bid: clamp(safeInt(entry.bid), 0, state.round),
        won: clamp(safeInt(entry.won), 0, state.round),
        pirates: Math.max(0, safeInt(entry.pirates)),
        mermaid: !!entry.mermaid,
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

  // Initial render
  render();

  // Re-render on breakpoint change (tab behavior)
  window.addEventListener("resize", () => { if(state.mode === "game") renderEntries(); });

})();
