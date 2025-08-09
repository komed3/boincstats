# Load requirements
from bs4 import BeautifulSoup, Tag
import json
import os
import random
from selenium import webdriver
import time

# Global vars
CONFIG: dict = {}
DRIVER = None

# Instantiate Chrome WebDriver with options
def init_driver () -> None :
    global DRIVER
    opt = webdriver.ChromeOptions()
    opt.add_argument( '--headless=new' )
    DRIVER = webdriver.Chrome( options = opt )

# Close the WebDriver
def close_driver () -> None :
    global DRIVER
    if DRIVER:
        DRIVER.quit()

# Load config file with user info and URLs
def load_config () -> bool :
    global CONFIG
    with open( './config.json', 'r', encoding='utf-8' ) as cfg:
        CONFIG = json.load( cfg )
        return True
    return False

# Get the path to the database file
def get_db_path ( name: str ) -> str :
    return os.path.join( 'db', f'{name}.txt' )

# Resolves an URL and replace dynamic vars, like UID or username
def resolve_url ( url: str ) -> str :
    global CONFIG
    for k in [ 'cpid', 'uid', 'username' ]:
        url = url.replace( '$' + k, CONFIG.get( k, '' ) )
    return url

# Gets the stream from a URL and returns the content
def get_stream ( url: str ) -> ( str | None ) :
    global DRIVER
    if DRIVER:
        DRIVER.get( url )
        return DRIVER.page_source

# Parse the HTML stream and extract table data
def parse_table ( stream: str, opt: dict ) -> list :
    soup = BeautifulSoup( stream, 'html.parser' )
    table = soup.find( id = opt.get( 'id', '' ) )
    data: list = []
    if table and isinstance( table, Tag ):
        tbody = table.find( 'tbody' )
        if tbody and isinstance( tbody, Tag ):
            for row in tbody.find_all( 'tr' ):
                if not isinstance( row, Tag ):
                    continue
                if cols := [ td.get_text( strip = True ) for td in row.find_all( 'td' ) ]:
                    data.append( cols )
    return data

# Validate and format data by given column types
def validate_row ( row: list, cols: dict ) -> ( list | None ):
    formatted: list = []
    for value, ( _, typ ) in zip( row, cols.items() ):
        if typ == 'date':
            if not value or len( value ) != 10 or value[ 4 ] != '-' or value[ 7 ] != '-':
                return None
            formatted.append( value )
        elif typ == 'number':
            try:
                num = int( value.replace( ',', '' ) )
                formatted.append( str( num ) )
            except ValueError:
                return None
        else:
            formatted.append( value )
    return formatted

# Load data from the database
def load_from_db ( name: str ) -> dict :
    path: str = get_db_path( name )
    data: dict = {}
    if os.path.exists( path ):
        with open( path, 'r', encoding = 'utf-8' ) as f:
            for line in f:
                parts: list = line.strip().split()
                if parts:
                    data[ parts[ 0 ] ] = line.strip()
    return data

# Save data to the database
def save_to_db ( name: str, opt: dict, data: list ) -> bool :
    if not data: return False
    os.makedirs( 'db', exist_ok = True )
    cols: dict = opt.get( 'cols', {} )
    path: str = get_db_path( name )
    if opt.get( 'incremental', True ) == True:
        prev: dict = load_from_db( name )
    else:
        prev: dict = {}
    for row in data:
        if len( row ) < len( cols ):
            continue # Invalid row
        frow = validate_row( row, cols )
        if not frow:
            continue # Invalid format
        prop = frow[ 0 ]
        if prop not in prev:
            prev[ prop ] = ' '.join( frow[ :len( cols ) ] )
    sort = [ prev[ k ] for k in sorted( prev.keys() ) ]
    with open( path, 'w', encoding = 'utf-8' ) as f:
        for line in sort:
            f.write( line + '\n' )
    return True

# The main loop for scraping pages defined in config
def scraping () -> None :
    pages: dict = CONFIG.get( 'pages', {} )
    for page, opt in pages.items():
        if url := resolve_url( opt.get( 'url', '' ) ):
            if stream := get_stream( url ):
                if data := parse_table( stream, opt ):
                    save_to_db( page, opt, data )
            time.sleep( random.randint( 5, 15 ) )

# The main program loop
def main () -> None :
    if load_config():
        init_driver()
        scraping()
        close_driver()

# Run the program
# Safely execute the main function
if __name__ == '__main__': main()
