/**
 * Outputs the latest highlights from daily data.
 * @param {Array} dailyData - Array of daily data objects. 
 */
function renderHighlights ( dailyData ) {

    if ( ! dailyData.length ) return;

    for ( const [ key, val ] of Object.entries( dailyData.at( -1 ) ) ) {

        const el = document.querySelector( `#highlights [data-item="${key}"]` );

        if ( el ) el.innerHTML = window[
            el.dataset.fnc ?? 'formatNumber'
        ]( val, el.dataset.decimals ?? 0 );

    }

}

/**
 * Renders charts based on daily data.
 * @param {Array} dailyData - Array of daily data objects, each containing date, total points, daily points, rank, and country rank.
 */
function renderCharts( dailyData ) {

    if ( ! dailyData.length ) return;

    const data = dailyData.slice( -60 );
    const labels = data.map( r => formatDate( r.date ) );

    Object.values( chartConfig ).forEach( chart => {

        renderChart(
            document.getElementById( chart.id ),
            {
                labels,
                data: data.map( r => Number ( r[ chart.col ] ) ),
                label: chart.label,
                color: chart.color,
                type: chart.isBar ? 'bar' : 'line',
                reverseY: chart.reverseY,
                isBar: chart.isBar,
                stepped: chart.stepped,
                decimals: chart.decimals
            }
        );

    } );

}

/**
 * Main Function
 * Initializes the page by fetching data and rendering tables and charts.
 * This function is called when the DOM content is fully loaded.
 */
async function main () {

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
    renderTable( 'dailyTable', dailyCols, daily, dailyLabels, ( k, v ) =>
        k === 'date' ? `<td>${ formatDate( v ) }</td>` :
        k.endsWith( '_cng' ) ? `<td>${ formatDiff( v ) }</td>` :
        `<td>${ formatNumber( v ) }</td>`,
        0, true
    );

    renderTable( 'projectsTable', projectsCols, projects, projectsLabels, ( k, v ) =>
        k === 'project' ? `<td>${ v.replace( /^"|"$/g, '' ) }</td>` :
        k.startsWith( 'rank_cng_' ) ? `<td>${ formatDiff( v ) }</td>` :
        `<td>${ formatNumber( v ) }</td>`
    );

    renderTable( 'hostsTable', hostsCols, hosts, hostsLabels, ( k, v ) =>
        k === 'cpu' || k === 'os' ? `<td>${v}</td>` :
        `<td>${ formatNumber( v ) }</td>`
    );

}

/**
 * Main entry point for the script.
 * This function is called when the DOM content is fully loaded.
 */
window.addEventListener( 'DOMContentLoaded', main );
