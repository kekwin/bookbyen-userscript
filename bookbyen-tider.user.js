// ==UserScript==
// @name         Book Byen: bedre "Tider"
// @namespace    https://github.com/kekwin
// @version      1.0.0
// @description  Sortérbare kolonner, farve pr. ugedag og bane, ugedag-kolonne, uden vandret scroll og med knapperne fremme på Book Byens "Tider"-side.
// @match        https://www.bookbyen.brnd.com/tider*
// @match        https://bookbyen.brnd.com/tider*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  "use strict";
  if (window.__bbTider) return;
  window.__bbTider = true;

  const TABLE_ID = "tiderbookinglisttbl";
  const SORT_KEY = "bbTiderSort";
  const WEEKDAYS = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
  // Grundfarve (hue) pr. ugedag, indeks som Date.getDay(). Tirsdag blå og søndag grøn skiller sig tydeligst ud.
  const HUES = [140, 25, 215, 280, 45, 330, 180];

  // Kolonnerne i den rækkefølge, de vises. `label` er data-label på cellerne fra Book Byen; "weekday" er vores egen.
  const COLUMNS = [
    { key: "weekday", title: "Ugedag", sort: (r) => [(r.weekday + 6) % 7, r.time, r.lane, r.start] },
    { key: "Bookingtime", title: "Tid", sort: (r) => [r.time, (r.weekday + 6) % 7, r.lane, r.start] },
    { key: "disp", title: "Bane", sort: (r) => [r.lane, (r.weekday + 6) % 7, r.time, r.start] },
    { key: "BookingDate", title: "Datoer", sort: (r) => [r.start, r.end] },
    { key: "Status", title: "Status", sort: (r) => [r.status, r.start] },
    { key: "BookingPrice", title: "Pris kr.", sort: (r) => [r.price, r.start] },
    { key: "StedName", title: "Anlæg", sort: (r) => [r.place, r.start], hideIfSame: true },
    { key: "bookingcode", title: "Ansøgning", sort: (r) => [r.code] },
    { key: "Redigér", title: "Handling" },
  ];
  // Kolonner, der altid skjules (navnet er altid ens, aktiviteten står i banen, "Dato" er tom for faste tider).
  const HIDDEN = ["BookingFor", "ActivityName", "Bookingslotdate"];

  const css = `
    #${TABLE_ID}.bb { width: 100%; table-layout: auto; border-collapse: separate; border-spacing: 0 4px; }
    #${TABLE_ID}.bb th, #${TABLE_ID}.bb td { white-space: nowrap; padding: 8px 10px; vertical-align: middle; text-align: left; }
    #${TABLE_ID}.bb th.bb-sortable { cursor: pointer; user-select: none; }
    #${TABLE_ID}.bb th.bb-sortable:hover { text-decoration: underline; }
    #${TABLE_ID}.bb th .bb-arrow { display: inline-block; width: 1em; margin-left: 4px; opacity: 0.7; }
    #${TABLE_ID}.bb tbody tr td { background: var(--bb-bg); border-top: 1px solid var(--bb-line); border-bottom: 1px solid var(--bb-line); }
    #${TABLE_ID}.bb tbody tr td:first-child { border-left: 6px solid var(--bb-strong); border-radius: 8px 0 0 8px; }
    #${TABLE_ID}.bb tbody tr td:last-child { border-right: 1px solid var(--bb-line); border-radius: 0 8px 8px 0; }
    #${TABLE_ID}.bb tbody tr.bb-rejected td { background: #f3f3f3; color: #888; text-decoration: line-through; border-left-color: #ccc; }
    #${TABLE_ID}.bb .bb-weekday { font-weight: 700; text-transform: capitalize; }
    #${TABLE_ID}.bb .bb-lane { font-weight: 700; }
    #${TABLE_ID}.bb .bb-sub { display: block; font-size: 0.8em; opacity: 0.7; }
    #${TABLE_ID}.bb .bb-actions { display: flex; gap: 6px; }
    #${TABLE_ID}.bb .bb-actions button { font: inherit; font-size: 0.85em; padding: 3px 10px; border-radius: 6px; border: 1px solid #999; background: #fff; cursor: pointer; text-decoration: none; }
    #${TABLE_ID}.bb .bb-actions button.bb-renew { background: #1f3f9a; border-color: #1f3f9a; color: #fff; font-weight: 600; }
    #${TABLE_ID}.bb td[data-label="BookingDate"], #${TABLE_ID}.bb td[data-label="bookingcode"] { text-align: left !important; }
    #${TABLE_ID}.bb .bb-hidden { display: none !important; }
    .table-responsive:has(> #${TABLE_ID}.bb) { overflow-x: visible; }
    /* Alle rækker vises sorteret, så Book Byens sidevisning er overflødig */
    body:has(#${TABLE_ID}.bb) #tiderbookinglistPagination { display: none !important; }
  `;

  /** "04/10/26" → Date (lokal tid, midnat). */
  const parseDate = (s) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{2,4})$/.exec(s.trim());
    if (!m) return null;
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(year, Number(m[2]) - 1, Number(m[1]));
  };
  const iso = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
  const shortDate = (d) => d.toLocaleDateString("da-DK", { day: "numeric", month: "short" }).replace(".", "");

  const cellText = (row, label) => row.querySelector(`td[data-label="${label}"]`)?.innerText.trim() ?? "";

  /** Bane fra "Squash (Squash - Opdelt) - Squash A" → "Squash A", og et indeks til nuancen (A = 0, B = 1 …). */
  const laneOf = (disp) => {
    const lane = disp.split(" - ").at(-1)?.trim() || disp;
    const last = lane.split(/\s+/).at(-1) ?? "";
    let index = 0;
    if (/^[A-Za-z]$/.test(last)) index = last.toUpperCase().charCodeAt(0) - 65;
    else if (/^\d+$/.test(last)) index = Number(last) - 1;
    else index = [...lane].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 0);
    return { lane, index };
  };

  const parseRow = (tr) => {
    const [from, to] = cellText(tr, "BookingDate").split("-");
    const startDate = parseDate(from ?? "") ?? parseDate(cellText(tr, "Bookingslotdate"));
    const endDate = parseDate(to ?? "") ?? startDate;
    const { lane, index } = laneOf(cellText(tr, "disp"));
    return {
      tr,
      code: cellText(tr, "bookingcode"),
      place: cellText(tr, "StedName"),
      lane,
      laneIndex: index,
      start: iso(startDate),
      end: iso(endDate),
      startDate,
      endDate,
      weekday: startDate ? startDate.getDay() : 7,
      time: cellText(tr, "Bookingtime"),
      price: Number(cellText(tr, "BookingPrice").replace(/\./g, "").replace(",", ".")) || 0,
      status: cellText(tr, "Status"),
    };
  };

  /** Farven: grundfarve efter ugedag, nuance efter bane (lidt drejet og lidt mørkere for hver bane). */
  const colorRow = (r) => {
    const tr = r.tr;
    if (/afvist|annuller/i.test(r.status)) {
      tr.classList.add("bb-rejected");
      return;
    }
    const base = HUES[r.weekday] ?? 0;
    const step = r.laneIndex % 6;
    const hue = (base + step * 20) % 360;
    tr.style.setProperty("--bb-bg", `hsl(${hue} 70% ${93 - step * 5}%)`);
    tr.style.setProperty("--bb-line", `hsl(${hue} 45% ${80 - step * 5}%)`);
    tr.style.setProperty("--bb-strong", `hsl(${hue} 65% ${45 - step * 5}%)`);
  };

  const compare = (a, b) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i];
      const y = b[i];
      if (x === y) continue;
      if (typeof x === "number" && typeof y === "number") return x - y;
      return String(x ?? "").localeCompare(String(y ?? ""), "da", { numeric: true });
    }
    return 0;
  };

  const loadSort = () => {
    try {
      const s = JSON.parse(localStorage.getItem(SORT_KEY) ?? "");
      if (COLUMNS.some((c) => c.key === s.key && c.sort)) return s;
    } catch {
      /* ingen gemt sortering */
    }
    return { key: "weekday", dir: 1 };
  };
  const saveSort = (s) => {
    try {
      localStorage.setItem(SORT_KEY, JSON.stringify(s));
    } catch {
      /* privat vindue */
    }
  };

  const enhance = (table) => {
    if (table.dataset.bb) return;
    table.dataset.bb = "1";
    table.classList.add("bb");

    const headRow = table.tHead?.rows[0];
    const body = table.tBodies[0];
    if (!headRow || !body) return;
    const trs = [...body.rows].filter((tr) => tr.querySelector("td[data-label]"));
    if (!trs.length) return;

    // Kolonnernes data-label ud fra den første række, så overskrifterne kan følge med, når cellerne flyttes.
    const labels = [...trs[0].cells].map((td) => td.dataset.label ?? "");
    const headByLabel = new Map(labels.map((l, i) => [l, headRow.cells[i]]));
    const rows = trs.map(parseRow);

    // Ugedag som ny celle i hver række.
    for (const r of rows) {
      const td = document.createElement("td");
      td.dataset.label = "weekday";
      td.className = "bb-weekday";
      td.textContent = r.weekday < 7 ? WEEKDAYS[r.weekday] : "";
      r.tr.append(td);
    }
    const weekdayTh = document.createElement("th");
    weekdayTh.scope = "col";
    headRow.append(weekdayTh);
    headByLabel.set("weekday", weekdayTh);

    // Bane i kort form, datoer med antal uger.
    for (const r of rows) {
      const disp = r.tr.querySelector('td[data-label="disp"]');
      if (disp) {
        disp.title = disp.textContent.trim();
        disp.replaceChildren(Object.assign(document.createElement("span"), { className: "bb-lane", textContent: r.lane }));
      }
      const dates = r.tr.querySelector('td[data-label="BookingDate"]');
      if (dates && r.startDate && r.endDate) {
        const weeks = Math.round((r.endDate - r.startDate) / (7 * 864e5)) + 1;
        dates.replaceChildren(
          document.createTextNode(`${shortDate(r.startDate)} – ${shortDate(r.endDate)}`),
          Object.assign(document.createElement("span"), { className: "bb-sub", textContent: `${weeks} ${weeks === 1 ? "uge" : "uger"}` }),
        );
      }
      colorRow(r);
    }

    // Handling: menupunkterne som knapper i stedet for en menu ude til højre. Knappen klikker på det oprindelige punkt.
    for (const r of rows) {
      const td = r.tr.querySelector('td[data-label="Redigér"]');
      const items = td ? [...td.querySelectorAll("li[onclick]")] : [];
      if (!td || !items.length) continue;
      const box = document.createElement("div");
      box.className = "bb-actions";
      for (const li of items) {
        const text = li.textContent.trim();
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = /forny/i.test(text) ? "Forny" : /rediger/i.test(text) ? "Rediger" : text;
        button.title = text;
        if (/forny/i.test(text)) button.className = "bb-renew";
        button.addEventListener("click", () => li.click());
        box.append(button);
      }
      for (const child of td.children) child.classList.add("bb-hidden");
      td.append(box);
    }

    // Kolonner: skjul de overflødige, og dem der er ens i alle rækker, hvor det er valgt.
    const hidden = new Set(HIDDEN);
    labels.forEach((l) => {
      if (!l) hidden.add(l); // den skjulte afkrydsningskolonne
    });
    for (const c of COLUMNS) {
      if (c.hideIfSame && new Set(rows.map((r) => cellText(r.tr, c.key))).size <= 1) hidden.add(c.key);
    }
    const order = [...COLUMNS.map((c) => c.key), ...labels.filter((l) => !COLUMNS.some((c) => c.key === l))];
    const place = (cells, label) => {
      const cell = cells.get(label);
      if (!cell) return null;
      cell.classList.toggle("bb-hidden", hidden.has(label));
      return cell;
    };
    for (const label of order) {
      const th = place(headByLabel, label);
      if (th) headRow.append(th);
    }
    for (const r of rows) {
      const cells = new Map([...r.tr.cells].map((td) => [td.dataset.label ?? "", td]));
      for (const label of order) {
        const td = place(cells, label);
        if (td) r.tr.append(td);
      }
    }

    // Overskrifter og sortering.
    let sort = loadSort();
    const apply = () => {
      const col = COLUMNS.find((c) => c.key === sort.key) ?? COLUMNS[0];
      const sorted = [...rows].sort((a, b) => sort.dir * compare(col.sort(a), col.sort(b)));
      for (const r of sorted) {
        r.tr.style.display = ""; // Book Byens sidevisning skjuler rækker; alle vises
        body.append(r.tr);
      }
      for (const c of COLUMNS) {
        const th = headByLabel.get(c.key);
        const arrow = th?.querySelector(".bb-arrow");
        if (arrow) arrow.textContent = c.key === sort.key ? (sort.dir > 0 ? "▲" : "▼") : "";
        th?.setAttribute("aria-sort", c.key === sort.key ? (sort.dir > 0 ? "ascending" : "descending") : "none");
      }
    };
    for (const c of COLUMNS) {
      const th = headByLabel.get(c.key);
      if (!th) continue;
      th.textContent = c.title;
      if (!c.sort) continue;
      th.classList.add("bb-sortable");
      th.title = `Sortér efter ${c.title.toLowerCase()}`;
      th.append(Object.assign(document.createElement("span"), { className: "bb-arrow" }));
      th.addEventListener("click", () => {
        sort = { key: c.key, dir: sort.key === c.key ? -sort.dir : 1 };
        saveSort(sort);
        apply();
      });
    }
    apply();
  };

  const style = document.createElement("style");
  style.id = "bb-tider-style";
  style.textContent = css;
  document.head.append(style);

  // Tabellen hentes med AJAX og kan blive tegnet igen (filter, annullering), så der holdes øje med siden.
  const scan = () => {
    const table = document.getElementById(TABLE_ID);
    if (table) enhance(table);
  };
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
})();
