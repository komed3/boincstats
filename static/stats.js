// CSV-Parser: unterstützt Felder mit Anführungszeichen und Leerzeichen
function parseCSVLine(line) {
    const result = [];
    let inQuotes = false, field = '';
    for (let i = 0; i < line.length; ++i) {
        const c = line[i];
        if (c === '"') inQuotes = !inQuotes;
        else if (c === ' ' && !inQuotes) {
            if (field.length) { result.push(field); field = ''; }
            while (line[i + 1] === ' ') ++i;
        } else field += c;
    }
    if (field.length) result.push(field);
    return result;
}

// Daten laden, Null-Werte filtern
async function fetchTable(path, colNames, filterZeroCol) {
    const resp = await fetch(path);
    if (!resp.ok) return [];
    const text = await resp.text();
    return text
        .split('\n')
        .filter(line => line.trim())
        .map(parseCSVLine)
        .filter(cols => !filterZeroCol || (cols[colNames.indexOf(filterZeroCol)] !== "0" && cols[colNames.indexOf(filterZeroCol)] !== "0.0"))
        .map(cols => {
            let obj = {};
            colNames.forEach((k, i) => obj[k] = cols[i]);
            return obj;
        });
}

// Formatierung
function formatNumber(n) {
    return n && !isNaN(n) ? Number(n).toLocaleString('de-DE') : '-';
}
function formatDate(d) {
    if (!d) return '-';
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}`;
}

// Highlights (Kacheln)
function renderHighlights(dailyData) {
    if (!dailyData.length) return;
    const latest = dailyData[dailyData.length - 1];
    const tiles = [
        { label: "Gesamtpunkte", value: formatNumber(latest.total) },
        { label: "Tagespunkte", value: formatNumber(latest.daily) },
        { label: "Gesamtrang", value: formatNumber(latest.rank) },
        { label: "Länderrang", value: formatNumber(latest.country_rank) },
        { label: "Veränderung (Tag)", value: formatNumber(latest.rank_cng) },
    ];
    document.getElementById('highlights').innerHTML = tiles.map(tile =>
        `<div class="highlight-tile">
            <h3>${tile.label}</h3>
            <p>${tile.value}</p>
        </div>`
    ).join('');
}

// Chart-Kacheln mit Titel
function renderChartTiles() {
    const chartInfo = [
        { id: "totalPointsChart", title: "Gesamtpunkte" },
        { id: "rankChart", title: "Gesamtrang" },
        { id: "dailyPointsChart", title: "Tagespunkte" },
        { id: "countryRankChart", title: "Länderrang" }
    ];
    document.getElementById('charts').innerHTML = chartInfo.map(c =>
        `<div class="chart-tile">
            <h3>${c.title}</h3>
            <canvas id="${c.id}"></canvas>
        </div>`
    ).join('');
}

// Tabellen sortierbar machen
function makeTableSortable(tableId, colNames, data, colLabels, formatCell) {
    let sortCol = 0, sortAsc = false;
    function render(sortedData) {
        const thead = `<tr>${colLabels.map((l, i) =>
            `<th data-idx="${i}" class="sortable">${l}${sortCol === i ? (sortAsc ? ' ▲' : ' ▼') : ''}</th>`
        ).join('')}</tr>`;
        const rows = sortedData.map(row =>
            `<tr>${colNames.map((k, j) => formatCell(k, row[k])).join('')}</tr>`
        ).join('');
        document.getElementById(tableId).innerHTML = `<thead>${thead}</thead><tbody>${rows}</tbody>`;
        // Event-Listener für Sortierung
        document.querySelectorAll(`#${tableId} th.sortable`).forEach(th => {
            th.onclick = () => {
                const idx = Number(th.dataset.idx);
                if (sortCol === idx) sortAsc = !sortAsc; else { sortCol = idx; sortAsc = true; }
                const key = colNames[sortCol];
                const sorted = [...data].sort((a, b) => {
                    let va = a[key], vb = b[key];
                    if (!isNaN(va) && !isNaN(vb)) { va = Number(va); vb = Number(vb); }
                    return (va > vb ? 1 : va < vb ? -1 : 0) * (sortAsc ? 1 : -1);
                });
                render(sorted);
            };
        });
    }
    render(data);
}

// Charts
function renderCharts(dailyData) {
    if (!dailyData.length) return;
    const labels = dailyData.map(r => formatDate(r.date));
    const totalPoints = dailyData.map(r => Number(r.total));
    const dailyPoints = dailyData.map(r => Number(r.daily));
    const rank = dailyData.map(r => Number(r.rank));
    const countryRank = dailyData.map(r => Number(r.country_rank));
    const chartOpts = {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
        elements: { point: { radius: 0 }, line: { borderWidth: 3 } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#e5e7eb', lineWidth: 1 }, ticks: { color: '#888' } }
        }
    };
    new Chart(document.getElementById('totalPointsChart').getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Gesamtpunkte', data: totalPoints, borderColor: '#3b82f6', backgroundColor: '#3b82f633', fill: false }] },
        options: chartOpts
    });
    new Chart(document.getElementById('rankChart').getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Gesamtrang', data: rank, borderColor: '#22c55e', backgroundColor: '#22c55e33', fill: false }] },
        options: { ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, reverse: true } } }
    });
    new Chart(document.getElementById('dailyPointsChart').getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Tagespunkte', data: dailyPoints, backgroundColor: '#fbbf24' }] },
        options: { ...chartOpts, elements: { bar: { borderRadius: 3 } } }
    });
    new Chart(document.getElementById('countryRankChart').getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Länderrang', data: countryRank, borderColor: '#8b5cf6', backgroundColor: '#8b5cf633', fill: false }] },
        options: { ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, reverse: true } } }
    });
}

// Hauptfunktion
async function main() {
    const dailyCols = ["date", "total", "daily", "rank", "rank_cng", "team_rank", "team_cng", "country_rank", "country_cng"];
    const dailyLabels = ["Datum", "Gesamt", "Tagespunkte", "Rang", "Δ Rang", "Team-Rang", "Δ Team", "Land-Rang", "Δ Land"];
    const projectsCols = ["project", "total", "share", "today", "daily", "weekly", "monthly", "rank", "rank_cng_day", "rank_cng_week", "rank_cng_month", "team_rank", "country_rank"];
    const projectsLabels = ["Projekt", "Gesamt", "Anteil", "Heute", "Täglich", "Wöchentlich", "Monatlich", "Rang", "Δ Tag", "Δ Woche", "Δ Monat", "Team-Rang", "Land-Rang"];
    const hostsCols = ["rank", "cpu", "cores", "os", "total", "daily", "weekly", "monthly", "avg"];
    const hostsLabels = ["Rang", "CPU", "Cores", "OS", "Gesamt", "Täglich", "Wöchentlich", "Monatlich", "Ø"];

    // Daten laden, Null-Werte filtern
    const [daily, projects, hosts] = await Promise.all([
        fetchTable('db/daily', dailyCols, "total"),
        fetchTable('db/projects', projectsCols),
        fetchTable('db/hosts', hostsCols)
    ]);

    renderHighlights(daily);
    renderChartTiles();
    renderCharts(daily);

    // Tabellen sortierbar machen
    makeTableSortable("dailyTable", dailyCols, daily, dailyLabels, (k, v) =>
        k === "date" ? `<td>${formatDate(v)}</td>` :
        `<td>${formatNumber(v)}</td>`
    );
    makeTableSortable("projectsTable", projectsCols, projects, projectsLabels, (k, v) =>
        k === "project" ? `<td style="text-align:left">${v.replace(/^"|"$/g, '')}</td>` :
        `<td>${formatNumber(v)}</td>`
    );
    makeTableSortable("hostsTable", hostsCols, hosts, hostsLabels, (k, v) =>
        (k === "cpu" || k === "os") ? `<td style="text-align:left">${v}</td>` :
        `<td>${formatNumber(v)}</td>`
    );
}

window.addEventListener('DOMContentLoaded', main);