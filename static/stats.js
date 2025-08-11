// Hilfsfunktion: CSV-ähnliche Datei in Array von Objekten umwandeln
async function fetchTable(path, colNames) {
    const resp = await fetch(path);
    if (!resp.ok) return [];
    const text = await resp.text();
    return text
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            const cols = line.trim().split(/\s+/);
            let obj = {};
            colNames.forEach((k, i) => obj[k] = cols[i]);
            return obj;
        });
}

// Formatierungsfunktionen
function formatNumber(n) {
    return n ? Number(n).toLocaleString('de-DE') : '-';
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
    const prev = dailyData[dailyData.length - 2] || latest;
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

// Tabellen
function renderTable(data, colNames, colLabels, tableId) {
    if (!data.length) return;
    const thead = `<tr>${colLabels.map(l => `<th>${l}</th>`).join('')}</tr>`;
    const rows = data.map(row =>
        `<tr>${colNames.map(k => {
            if (k === "date") return `<td>${formatDate(row[k])}</td>`;
            if (k === "project" || k === "cpu" || k === "os") return `<td style="text-align:left">${row[k]}</td>`;
            return `<td>${formatNumber(row[k])}</td>`;
        }).join('')}</tr>`
    ).join('');
    document.getElementById(tableId).innerHTML = `<thead>${thead}</thead><tbody>${rows}</tbody>`;
}

// Charts
function renderCharts(dailyData) {
    if (!dailyData.length) return;
    const labels = dailyData.map(r => formatDate(r.date));
    const totalPoints = dailyData.map(r => Number(r.total));
    const dailyPoints = dailyData.map(r => Number(r.daily));
    const rank = dailyData.map(r => Number(r.rank));
    const countryRank = dailyData.map(r => Number(r.country_rank));

    // Chart.js Farben
    const blue = 'rgba(59,130,246,0.7)';
    const green = 'rgba(34,197,94,0.7)';
    const orange = 'rgba(251,191,36,0.7)';
    const purple = 'rgba(139,92,246,0.7)';

    new Chart(document.getElementById('totalPointsChart').getContext('2d'), {
        type: 'line',
        data: {
            labels, datasets: [{
                label: 'Gesamtpunkte',
                data: totalPoints,
                borderColor: blue, backgroundColor: blue, fill: false, tension: 0.2
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    new Chart(document.getElementById('rankChart').getContext('2d'), {
        type: 'line',
        data: {
            labels, datasets: [{
                label: 'Gesamtrang',
                data: rank,
                borderColor: green, backgroundColor: green, fill: false, tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { reverse: true } }
        }
    });

    new Chart(document.getElementById('dailyPointsChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels, datasets: [{
                label: 'Tagespunkte',
                data: dailyPoints,
                backgroundColor: orange
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    new Chart(document.getElementById('countryRankChart').getContext('2d'), {
        type: 'line',
        data: {
            labels, datasets: [{
                label: 'Länderrang',
                data: countryRank,
                borderColor: purple, backgroundColor: purple, fill: false, tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { reverse: true } }
        }
    });
}

// Hauptfunktion: Daten laden und alles rendern
async function main() {
    // Spalten laut deiner Datenstruktur
    const dailyCols = ["date", "total", "daily", "rank", "rank_cng", "team_rank", "team_cng", "country_rank", "country_cng"];
    const dailyLabels = ["Datum", "Gesamt", "Tagespunkte", "Rang", "Δ Rang", "Team-Rang", "Δ Team", "Land-Rang", "Δ Land"];
    const projectsCols = ["project", "total", "share", "today", "daily", "weekly", "monthly", "rank", "rank_cng_day", "rank_cng_week", "rank_cng_month", "team_rank", "country_rank"];
    const projectsLabels = ["Projekt", "Gesamt", "Anteil", "Heute", "Täglich", "Wöchentlich", "Monatlich", "Rang", "Δ Tag", "Δ Woche", "Δ Monat", "Team-Rang", "Land-Rang"];
    const hostsCols = ["rank", "cpu", "cores", "os", "total", "daily", "weekly", "monthly", "avg"];
    const hostsLabels = ["Rang", "CPU", "Cores", "OS", "Gesamt", "Täglich", "Wöchentlich", "Monatlich", "Ø"];

    // Daten laden
    const [daily, projects, hosts] = await Promise.all([
        fetchTable('db/daily', dailyCols),
        fetchTable('db/projects', projectsCols),
        fetchTable('db/hosts', hostsCols)
    ]);

    // Rendern
    renderHighlights(daily);
    renderCharts(daily);
    renderTable(daily, dailyCols, dailyLabels, "dailyTable");
    renderTable(projects, projectsCols, projectsLabels, "projectsTable");
    renderTable(hosts, hostsCols, hostsLabels, "hostsTable");
}

window.addEventListener('DOMContentLoaded', main);