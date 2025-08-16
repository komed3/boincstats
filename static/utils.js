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
