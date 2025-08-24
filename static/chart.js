/**
 * Main Function
 * Initializes the page by fetching data and rendering tables and charts.
 * This function is called when the DOM content is fully loaded.
 */
async function main () {

    const page = location.pathname.match( /(total|rank|active|country|average|daily)/ )?.[ 1 ] || 'total';
    const cfg = chartConfig[ page ];
    const data = await fetchTable( 'db/daily', dailyCols, 'total' );
    const labels = data.map( r => formatDate( r.date ) );
    const values = data.map( r => Number ( r[ cfg.col ] ) );
    const canvas = document.getElementById( cfg.id );

    // Range buttons
    const btns = Array.from( document.querySelectorAll( '#range-buttons button' ) );

    // Render chart for defined range (max. number of days)
    let chart;

    function renderChartForRange ( range ) {

        if ( chart ) chart.destroy();

        let len = range === 'max' ? labels.length : Math.min( labels.length, Number ( range ) );
        let start = Math.max( 0, labels.length - len );

        chart = renderChart(
            canvas,
            {
                labels: labels.slice( start ),
                data: values.slice( start ),
                label: cfg.label,
                color: cfg.color,
                type: cfg.isBar ? 'bar' : 'line',
                reverseY: cfg.reverseY,
                isBar: cfg.isBar,
                stepped: cfg.stepped,
                decimals: cfg.decimals
            }
        );

    }

    // Add event listener for range buttons
    btns.forEach( btn => { btn.onclick = () => {

        btns.forEach( b => b.classList.remove( 'active' ) );
        btn.classList.add( 'active' );

        renderChartForRange( btn.dataset.range );

    } } );

    // Initialize chart with range 3M (90 days)
    btns[ 2 ].classList.add( 'active' );
    renderChartForRange( 90 );

}

/**
 * Main entry point for the script.
 * This function is called when the DOM content is fully loaded.
 */
window.addEventListener( 'DOMContentLoaded', main );
