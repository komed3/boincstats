/**
 * Main Function
 * Initializes the page by fetching data and rendering tables and charts.
 * This function is called when the DOM content is fully loaded.
 */
async function main () {

    const page = location.pathname.match( /(total|rank|daily|country)/ )?.[ 1 ] || 'total';
    const cfg = chartConfig[ page ];
    const dailyCols = [ 'date', 'total', 'daily', 'rank', 'rank_cng', 'team_rank', 'team_cng', 'country_rank', 'country_cng' ];
    const data = await fetchTable( 'db/daily', dailyCols, 'total' );
    const labels = data.map( r => formatDate( r.date ) );
    const values = data.map( r => Number ( r[ cfg.col ] ) );

    // Dynamic range selection
    let maxPoints = Math.max( 30, Math.floor( window.innerWidth / 24 ) ),
        start = Math.max( 0, values.length - maxPoints ),
        end = values.length,
        chart;

    // Render chart
    function updateChart () {

        if ( chart ) chart.destroy();

        chart = renderChart(
            document.getElementById( cfg.id ),
            {
                labels,
                data: values,
                label: cfg.label,
                color: cfg.color,
                type: cfg.isBar ? 'bar' : 'line',
                reverseY: cfg.reverseY,
                isBar: cfg.isBar,
                stepped: cfg.stepped
            },
            { start, end }
        );

    }

    // Range Controls
    function renderControls() {

        const rc = document.getElementById( 'range-controls' );

        rc.innerHTML = `
            <label>Range: </label>
            <input type="range" min="10" max="${values.length}" value="${end-start}" id="rangeLen" style="width:200px;" />
            <span id="rangeLabel">${end-start} days</span>
        `;

        document.getElementById( 'rangeLen' ).oninput = e => {

            let len = Number ( e.target.value );

            start = Math.max( 0, values.length - len );
            end = values.length;

            document.getElementById( 'rangeLabel' ).textContent = `${len} days`;

            updateChart();

        };

    }

    renderControls();
    updateChart();

}

/**
 * Main entry point for the script.
 * This function is called when the DOM content is fully loaded.
 */
window.addEventListener( 'DOMContentLoaded', main );
