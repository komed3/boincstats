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

    const data = dailyData.slice( -60 );
    const labels = data.map( r => formatDate( r.date ) );

    renderChart(
        document.getElementById( 'totalPointsChart' ),
        {
            labels,
            data: data.map( r => Number ( r.total ) ),
            label: 'Total Points',
            color: '#3b82f6',
            type: 'line',
            reverseY: false,
            isBar: false,
            stepped: false
        }
    );

    renderChart(
        document.getElementById( 'worldRankChart' ),
        {
            labels,
            data: data.map( r => Number ( r.rank ) ),
            label: 'World Rank',
            color: '#22c55e',
            type: 'line',
            reverseY: true,
            isBar: false,
            stepped: true
        }
    );

    renderChart(
        document.getElementById( 'dailyPointsChart' ),
        {
            labels,
            data: data.map( r => Number ( r.daily ) ),
            label: 'Daily Points',
            color: '#fbbf24',
            type: 'bar',
            reverseY: false,
            isBar: true,
            stepped: false
        }
    );

    renderChart(
        document.getElementById( 'countryRankChart' ),
        {
            labels,
            data: data.map( r => Number ( r.country_rank ) ),
            label: 'Country Rank',
            color: '#8b5cf6',
            type: 'line',
            reverseY: true,
            isBar: false,
            stepped: true
        }
    );

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
