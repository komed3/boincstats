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
function renderCharts ( dailyData ) {

    if ( ! dailyData.length ) return;

    const data = dailyData.slice( -60 );
    const labels = data.map( r => formatDate( r.date ) );

    Object.values( chartConfig ).forEach( chart => {

        const el = document.getElementById( chart.id );

        if ( el ) renderChart( el, {
            labels,
            data: data.map( r => Number ( r[ chart.col ] ) ),
            label: chart.label,
            color: chart.color,
            type: chart.isBar ? 'bar' : 'line',
            reverseY: chart.reverseY,
            isBar: chart.isBar,
            stepped: chart.stepped,
            decimals: chart.decimals,
            grouping: chart.grouping
        } );

    } );

}

/**
 * Sets up projection controls and event listeners.
 * @param {Array} dailyData - Array of daily data objects.
 */
function projectionSetup ( dailyData ) {

    if ( ! dailyData.length ) return;

    const latest = dailyData.at( -1 );

    const elP = document.getElementById( 'projection-points' );
    const elD = document.getElementById( 'projection-date' );
    const elR = document.getElementById( 'projection-result' );

    if ( elP && elD && elR ) {

        elP.value = elP.min = latest.total;

        elP.addEventListener( 'input', ( e ) => projectionLiveUpdate( e, latest, elP, elD, elR ) );
        elP.addEventListener( 'change', ( e ) => projectionLiveUpdate( e, latest, elP, elD, elR ) );

        elD.value = elD.min = new Date().toISOString().split( 'T' )[ 0 ];

        elD.addEventListener( 'input', ( e ) => projectionLiveUpdate( e, latest, elP, elD, elR ) );
        elD.addEventListener( 'change', ( e ) => projectionLiveUpdate( e, latest, elP, elD, elR ) );

    }

}

/**
 * Handles live updates for projection inputs.
 * @param {Event} e - The input event.
 * @param {Object} data - The latest daily data object.
 * @param {HTMLElement} elP - The points input element.
 * @param {HTMLElement} elD - The date input element.
 * @param {HTMLElement} elR - The result display element.
 */
function projectionLiveUpdate ( e, data, elP, elD, elR ) {

    const today = new Date();
    let days = 0, update = false;

    if ( e.target.id === 'projection-points' ) {

        days = Math.ceil( ( parseInt( elP.value ) - data.total ) / data.rac_60 );

        if ( days >= 0 ) {

            today.setDate( today.getDate() + days );
            elD.value = today.toISOString().split( 'T' )[ 0 ];

            update = true;

        }

    } else if ( e.target.id === 'projection-date' ) {

        days = Math.ceil( ( new Date( elD.value ) - today ) / 84600000 );

        if ( days >= 0 ) {

            elP.value = parseInt( data.total ) + parseInt( days * data.rac_60 );

            update = true;

        }

    }

    if ( days > 1e5 ) elR.innerHTML = `Let’s be realistic! Try for a lower score or a closer date.`;
    else if ( update ) elR.innerHTML = `A score of <b>${ (
        formatNumber( elP.value )
    ) }</b> will be reached in <b>${ (
        formatNumber( days )
    ) }</b> days around <b>${ (
        formatDate( elD.value )
    ) }</b>`;

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

    // Set up projection
    projectionSetup( daily );

}

/**
 * Main entry point for the script.
 * This function is called when the DOM content is fully loaded.
 */
window.addEventListener( 'DOMContentLoaded', main );
