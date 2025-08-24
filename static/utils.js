/**
 * Parses a CSV line into an array of fields, handling quoted fields and spaces.
 * Handles quoted fields and ignores spaces outside quotes.
 * @param {string} line - The CSV line to parse.
 * @return {Array} - An array of fields extracted from the CSV line.
 */
function parseCSVLine ( line ) {

    const result = [];

    let inQuotes = false, field = '';

    for ( let i = 0; i < line.length; ++i ) {

        const c = line[ i ];

        if ( c === '"' ) inQuotes = ! inQuotes;
        else if ( c === ' ' && ! inQuotes ) {

            if ( field.length ) { result.push( field ); field = ''; }
            while ( line[ i + 1 ] === ' ') ++i;

        }
        else field += c;

    }

    if ( field.length ) result.push( field );

    return result;

}

/**
 * Fetches a CSV table from the given path, parses it, and returns an array of objects.
 * @param {string} path - The path to the CSV file.
 * @param {Array} colNames - The names of the columns to extract.
 * @param {string} [filterZeroCol] - Optional column name to filter out rows with zero values.
 * @return {Promise<Array>} - A promise that resolves to an array of objects representing the table.
 */
async function fetchTable ( path, colNames, filterZeroCol ) {

    const resp = await fetch( path );

    if ( ! resp.ok ) return [];

    const text = await resp.text();

    return text
        .split( '\n' )
        .filter( line => line.trim() )
        .map( parseCSVLine )
        .filter( cols => ! filterZeroCol || (
            cols[ colNames.indexOf( filterZeroCol ) ] !== '0' &&
            cols[ colNames.indexOf( filterZeroCol ) ] !== '0.0'
        ) )
        .map( cols => {
            let obj = {};
            colNames.forEach( ( k, i ) => obj[ k ] = cols[ i ] );
            return obj;
        } );

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
 * Formats a number into a compact form (K, M, B) for easier readability.
 * @param {number} n - The number to format.
 * @returns {string} - The formatted number as a string.
 */
function formatCompact ( n ) {

    n = Number ( n );

    if ( isNaN( n ) ) return '–';
    if ( Math.abs( n ) >= 1e6 ) return ( n / 1e6 ).toFixed( 1 ).replace( /\.0$/, '' ) + 'M';
    if ( Math.abs( n ) >= 1e3 ) return ( n / 1e3 ).toFixed( 1 ).replace( /\.0$/, '' ) + 'k';
    return n.toString();

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

    return `<diff class="equal">±0</diff>`;

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
 * Makes a table sortable by clicking on the column headers.
 * @param {string} tableId - The ID of the table to make sortable.
 * @param {Array} colNames - The names of the columns to sort by.
 * @param {Array} data - The data to populate the table with.
 * @param {Array} colLabels - The labels for the table headers.
 * @param {Function} formatCell - A function to format the cell content based on the column name and value.
 * @param {number} [initCol=0] - The initial column index to sort by.
 * @param {boolean} [initDesc=false] - Whether to initially sort in descending order
 */
function renderTable (
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
 * Renders a Chart.js chart based on the provided options.
 * @param {HTMLCanvasElement} canvas - The canvas element to render the chart on.
 * @param {Object} opts - Options for the chart (e.g. labels, data, color, type, ...).
 * @param {Object} [range] - Optional range to limit the data displayed in the chart.
 * @param {Object} [extra] - Additional Chart.js options to apply.
 */
function renderChart ( canvas, opts, range, extra ) {

    const { labels, data, label, color, type, reverseY, isBar } = opts;

    // Limit range
    let start = range?.start ?? 0,
        end = range?.end ?? labels.length;

    const l = labels.slice( start, end ),
          d = data.slice( start, end );

    Chart.defaults.font.family = '"Archivo", sans-serif';

    return new Chart( canvas.getContext( '2d' ), {
        type: type || ( isBar ? 'bar' : 'line' ),
        data: {
            labels: l,
            datasets: [ {
                label: label,
                data: d,
                borderColor: color,
                backgroundColor: color + ( isBar ? 'ff' : '11' ),
                fill: ! isBar,
                stepped: !! opts.stepped,
                ...( isBar ? {
                    borderRadius: 3
                } : {
                    pointRadius: 0,
                    borderWidth: 3
                } )
            } ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                    titleFont: { size: 13, weight: 400 },
                    titleColor: '#222',
                    bodyFont: { size: 20, weight: 600 },
                    bodyColor: color,
                    borderColor: color,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    callbacks: {
                        title: items => items[ 0 ].label,
                        label: ctx => formatNumber( ctx.parsed.y, opts.decimals || 0 )
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
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 6
                    }
                },
                y: {
                    grid: { color: '#f3f4f6', lineWidth: 1 },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 6,
                        callback: val => formatCompact( val )
                    },
                    reverse: !! reverseY
                }
            },
            ...extra
        }
    } );

}
