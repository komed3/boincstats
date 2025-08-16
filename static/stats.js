/**
 * Outputs the latest highlights from daily data.
 * @param {Array} dailyData - Array of daily data objects. 
 */
function renderHighlights ( dailyData ) {

    if ( ! dailyData.length ) return;

    const daycnt = dailyData.length;
    const latest = dailyData[ daycnt - 1 ];

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

/**
 * Renders charts based on daily data.
 * @param {Array} dailyData - Array of daily data objects, each containing date, total points, daily points, rank, and country rank.
 */
function renderCharts( dailyData ) {

    if ( ! dailyData.length ) return;

    dailyData = dailyData.slice( -60 );

    const labels = dailyData.map( r => formatDate( r.date ) );
    const totalPoints = dailyData.map( r => Number ( r.total ) );
    const dailyPoints = dailyData.map( r => Number ( r.daily ) );
    const rank = dailyData.map( r => Number ( r.rank ) );
    const countryRank = dailyData.map( r => Number ( r.country_rank ) );

    Chart.defaults.font.family = '"Archivo", sans-serif';

    const chartOpts = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                padding: {
                    top: 10, left: 10,
                    right: 24, bottom: 8
                },
                displayColors: false,
                titleMarginBottom: 0,
                titleFont: { size: 13 },
                titleColor: '#222',
                bodyFont: { size: 20 },
                bodyColor: '#3b82f6',
                borderColor: '#3b82f6',
                backgroundColor: '#fff',
                borderWidth: 1,
                callbacks: {
                    title: items => items[ 0 ].label,
                    label: ctx => {
                        return formatNumber( ctx.parsed.y );
                    }
                }
            }
        },
        elements: { point: { radius: 0 }, line: { borderWidth: 3 } },
        scales: {
            x: {
                grid: { color: '#f3f4f6', lineWidth: 1 },
                ticks: {
                    color: '#888',
                    maxRotation: 0,
                    minRotation: 0
                }
            },
            y: {
                grid: { color: '#f3f4f6', lineWidth: 1 },
                ticks: {
                    color: '#888',
                    maxTicksLimit: 6,
                    callback: val => formatCompact( val )
                }
            }
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

/**
 * Makes a table sortable by clicking on the column headers.
 * @param {string} tableId - The ID of the table to make sortable.
 * @param {Array} colNames - The names of the columns to sort by.
 * @param {Array} data - The data to populate the table with.
 * @param {Array} colLabels - The labels for the table headers.
 * @param {Function} formatCell - A function to format the cell content based on the column name and value.
 * @param {number} [initCol=0] - The initial column index to sort by.
 * @param {boolean} [initDesc=false] - Whether to initially sort in descending order
 */
function makeTableSortable (
    tableId, colNames, data, colLabels, formatCell,
    initCol = 0, initDesc = false
) {

    let sortCol = initCol, sortAsc = initDesc;

    function render ( sortedData ) {

        const thead = `<tr>${ colLabels.map( ( l, i ) =>
            `<th data-idx="${i}" class="sortable ${ (
                sortCol === i ? 'active' : ''
            ) }">${l}${ (
                sortCol === i ? ( sortAsc ? ' ▲' : ' ▼' ) : ''
            ) }</th>`
        ).join( '' ) }</tr>`;

        const rows = sortedData.map( row =>
            `<tr>${ colNames.map(
                ( k, _ ) => formatCell( k, row[ k ] )
            ).join( '' ) }</tr>`
        ).join( '' );

        document.getElementById( tableId ).innerHTML = `<thead>${thead}</thead><tbody>${rows}</tbody>`;

        // Event-Listener for sorting columns
        document.querySelectorAll( `#${tableId} th.sortable` ).forEach( th => {

            th.onclick = () => {

                const idx = Number ( th.dataset.idx );

                if ( sortCol === idx ) { sortAsc = ! sortAsc; }
                else { sortCol = idx; sortAsc = true; }

                const key = colNames[ sortCol ];

                const sorted = [ ...data ].sort( ( a, b ) => {

                    let va = a[ key ], vb = b[ key ];

                    if ( ! isNaN( va ) && ! isNaN( vb ) ) {
                        va = Number ( va );
                        vb = Number ( vb );
                    }

                    return ( va > vb ? 1 : va < vb ? -1 : 0 ) * ( sortAsc ? 1 : -1 );

                } );

                render( sorted );

            };

        } );

    }

    render( data );

    // Initial sort
    document.querySelectorAll( `#${tableId} th.sortable` )[ sortCol ].click();

}

/**
 * Main Function
 * Initializes the page by fetching data and rendering tables and charts.
 * This function is called when the DOM content is fully loaded.
 */
async function main () {

    const dailyCols = [ 'date', 'total', 'daily', 'rank', 'rank_cng', 'team_rank', 'team_cng', 'country_rank', 'country_cng' ];
    const dailyLabels = [ 'Date', 'Total', 'Daily', 'Rank', 'Δ Rank', 'Team Rank', 'Δ Team', 'Country Rank', 'Δ Country' ];
    const projectsCols = [ 'project', 'total', 'share', 'today', 'daily', 'weekly', 'monthly', 'rank', 'rank_cng_day', 'rank_cng_week', 'rank_cng_month', 'team_rank', 'country_rank' ];
    const projectsLabels = [ 'Project', 'Total', 'Share', 'Today', 'Daily', 'Weekly', 'Monthly', 'Rank', 'Δ Day', 'Δ Week', 'Δ Month', 'Team Rank', 'Country Rank' ];
    const hostsCols = [ 'rank', 'cpu', 'cores', 'os', 'total', 'daily', 'weekly', 'monthly', 'avg' ];
    const hostsLabels = [ 'Rank', 'CPU', 'Cores', 'OS', 'Total', 'Daily', 'Weekly', 'Monthly', 'Ø' ];

    // Load data, filter rows with "zero" values
    const [ daily, projects, hosts ] = await Promise.all( [
        fetchTable( 'db/daily', dailyCols, 'total' ),
        fetchTable( 'db/projects', projectsCols ),
        fetchTable( 'db/hosts', hostsCols )
    ] );

    // Render highlight tiles and charts
    renderHighlights( daily );
    renderCharts( daily );

    // Render sortable tables
    makeTableSortable( 'dailyTable', dailyCols, daily, dailyLabels, ( k, v ) =>
        k === 'date' ? `<td>${ formatDate( v ) }</td>` :
        k.endsWith( '_cng' ) ? `<td>${ formatDiff( v ) }</td>` :
        `<td>${ formatNumber( v ) }</td>`,
        0, true
    );

    makeTableSortable( 'projectsTable', projectsCols, projects, projectsLabels, ( k, v ) =>
        k === 'project' ? `<td>${ v.replace( /^"|"$/g, '' ) }</td>` :
        k.startsWith( 'rank_cng_' ) ? `<td>${ formatDiff( v ) }</td>` :
        `<td>${ formatNumber( v ) }</td>`
    );

    makeTableSortable( 'hostsTable', hostsCols, hosts, hostsLabels, ( k, v ) =>
        k === 'cpu' || k === 'os' ? `<td>${v}</td>` :
        `<td>${ formatNumber( v ) }</td>`
    );

}

/**
 * Main entry point for the script.
 * This function is called when the DOM content is fully loaded.
 */
window.addEventListener( 'DOMContentLoaded', main );
