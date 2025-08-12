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

/**
 * Formats a number for display, adding commas as thousands separators.
 * @param {number} n - The number to format.
 * @param {number} [d=0] - The number of decimal places to include.
 * @return {string} - The formatted number as a string, or '–' if the input is invalid.
 */
function formatNumber ( n, d = 0 ) {

    return n && ! isNaN( n ) ? Number( n ).toLocaleString( 'en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d
    } ) : '–';

}

/**
 * Formats a difference value, highlighting positive and negative changes.
 * @param {number} n - The difference value to format.
 * @param {number} [d=0] - The number of decimal places to include.
 * @return {string} - The formatted difference as a string, with color coding for positive and negative values.
 */
function formatDiff ( n, d = 0 ) {

    if ( isNaN( n ) || n === null || n === undefined ) return '–';

    const num = Number ( n );

    if ( num > 0 ) return `<diff class="up">+${formatNumber( num, d )}</diff>`;
    if ( num < 0 ) return `<diff class="down">${formatNumber( num, d )}</diff>`;

    return `<diff class="equal">±${formatNumber( num, d )}</diff>`;

}

/**
 * Formats a date to a human-readable string.
 * @param {string|Date} date - The date to format, can be a string or Date object.
 * @returns {string} - The formatted date as a string in 'MM/DD/YY' format, or '–' if the input is invalid.
 */
function formatDate ( date ) {

    return ! date ? '–' : new Date( date ).toLocaleDateString( 'en-US', {
        year: '2-digit', month: '2-digit', day: '2-digit',
    } );

}

/**
 * Outputs the latest highlights from daily data.
 * @param {Array} dailyData - Array of daily data objects. 
 */
function renderHighlights ( dailyData ) {

    if ( ! dailyData.length ) return;

    const daycnt = dailyData.length;
    const latest = dailyData[ dailyData.length - 1 ];

    document.querySelector( `#highlights [data-item="total_points"]` ).innerHTML =
        formatNumber( latest.total );
    document.querySelector( `#highlights [data-item="average_points"]` ).innerHTML =
        formatNumber( latest.total / daycnt, 1 );
    document.querySelector( `#highlights [data-item="world_rank"]` ).innerHTML =
        formatNumber( latest.rank );
    document.querySelector( `#highlights [data-item="country_rank"]` ).innerHTML =
        formatNumber( latest.country_rank );
    document.querySelector( `#highlights [data-item="rank_change"]` ).innerHTML =
        formatDiff( latest.rank_cng );

}

// Tabellen sortierbar machen
function makeTableSortable(tableId, colNames, data, colLabels, formatCell) {
    let sortCol = 0, sortAsc = false;
    function render(sortedData) {
        const thead = `<tr>${colLabels.map((l, i) =>
            `<th data-idx="${i}" class="sortable ${sortCol === i ? 'active' : ''}">${l}${sortCol === i ? (sortAsc ? ' ▲' : ' ▼') : ''}</th>`
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

/**
 * Renders charts based on daily data.
 * @param {Array} dailyData - Array of daily data objects, each containing date, total points, daily points, rank, and country rank.
 */
function renderCharts( dailyData ) {

    if ( ! dailyData.length ) return;

    const labels = dailyData.map( r => formatDate( r.date ) );
    const totalPoints = dailyData.map( r => Number ( r.total ) );
    const dailyPoints = dailyData.map( r => Number ( r.daily ) );
    const rank = dailyData.map( r => Number ( r.rank ) );
    const countryRank = dailyData.map( r => Number ( r.country_rank ) );

    const chartOpts = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true, mode: 'index', intersect: false }
        },
        elements: { point: { radius: 0 }, line: { borderWidth: 3 } },
        scales: {
            x: { grid: { color: '#f3f4f6', lineWidth: 1 } },
            y: { grid: { color: '#f3f4f6', lineWidth: 1 }, ticks: { color: '#888' } }
        }
    };

    new Chart( document.getElementById( 'totalPointsChart' ).getContext( '2d' ), {
        type: 'line',
        data: { labels, datasets: [ {
            label: 'Total Points',
            data: totalPoints,
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f611',
            fill: true
        } ] },
        options: chartOpts
    } );

    new Chart( document.getElementById( 'rankChart' ).getContext( '2d' ), {
        type: 'line',
        data: { labels, datasets: [ {
            label: 'World Rank',
            data: rank,
            borderColor: '#22c55e',
            backgroundColor: '#22c55e11',
            fill: true,
            stepped: true
        } ] },
        options: { ...chartOpts, scales: {
            ...chartOpts.scales, y: {
                ...chartOpts.scales.y,
                reverse: true
            }
        } }
    } );

    new Chart( document.getElementById( 'dailyPointsChart' ).getContext( '2d' ), {
        type: 'bar',
        data: { labels, datasets: [ {
            label: 'Daily Points',
            data: dailyPoints,
            backgroundColor: '#fbbf24'
        } ] },
        options: { ...chartOpts, elements: {
            bar: { borderRadius: 3 }
        }, scales: {
            ...chartOpts.scales, x: {
                ...chartOpts.scales.x,
                offset: true
            }, y: {
                ...chartOpts.scales.y,
                min: 0
            }
        } }
    } );

    new Chart( document.getElementById( 'countryRankChart' ).getContext( '2d' ), {
        type: 'line',
        data: { labels, datasets: [ {
            label: 'Country Rank',
            data: countryRank,
            borderColor: '#8b5cf6',
            backgroundColor: '#8b5cf611',
            fill: true,
            stepped: true
        } ] },
        options: { ...chartOpts, scales: {
            ...chartOpts.scales, y: {
                ...chartOpts.scales.y,
                reverse: true
            }
        } }
    } );

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

    renderHighlights( daily );
    renderCharts( daily );

    // Tabellen sortierbar machen
    makeTableSortable("dailyTable", dailyCols, daily, dailyLabels, (k, v) =>
        k === "date" ? `<td>${formatDate(v)}</td>` :
        `<td>${formatNumber(v)}</td>`
    );
    makeTableSortable("projectsTable", projectsCols, projects, projectsLabels, (k, v) =>
        k === "project" ? `<td>${v.replace(/^"|"$/g, '')}</td>` :
        `<td>${formatNumber(v)}</td>`
    );
    makeTableSortable("hostsTable", hostsCols, hosts, hostsLabels, (k, v) =>
        (k === "cpu" || k === "os") ? `<td>${v}</td>` :
        `<td>${formatNumber(v)}</td>`
    );
}

window.addEventListener('DOMContentLoaded', main);