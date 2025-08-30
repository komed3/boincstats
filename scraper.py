# Load requirements
from bs4 import BeautifulSoup, Tag
import json
import os
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
import time
from webdriver_manager.chrome import ChromeDriverManager

# Global vars
CONFIG: dict = {}
DRIVER = None

# Instantiate Chrome WebDriver with options
def init_driver () -> None :
    global DRIVER
    options = webdriver.ChromeOptions()
    options.add_argument( '--headless=new' )
    options.add_argument( '--disable-gpu' )
    options.add_argument( '--no-sandbox' )
    options.add_argument( '--disable-dev-shm-usage' )
    options.add_argument( '--disable-blink-features=AutomationControlled' )
    options.add_argument( '--window-size=1920,1080' )
    options.add_argument( 'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' )
    DRIVER = webdriver.Chrome(
      service = Service( ChromeDriverManager().install() ),
      options = options
    )

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
    return os.path.join( 'db', name )

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
        elif typ == 'int':
            try:
                num = int( '0' + value.replace( ',', '' ) )
                formatted.append( str( num ) )
            except ValueError:
                return None
        elif typ == 'float':
            try:
                num = float( '0' + value.replace( ',', '' ) )
                formatted.append( str( num ) )
            except ValueError:
                return None
        elif typ == 'string':
            formatted.append( f'"{value}"' )
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
def save_to_db ( name: str, opt: dict, data: list ) -> int :
    if not data: return 0
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
        test = frow[ 0 ]
        if opt.get( 'update', False ) or test not in prev:
            prev[ test ] = ' '.join( frow[ :len( cols ) ] )
    sort = [ prev[ k ] for k in sorted( prev.keys() ) ]
    with open( path, 'w', encoding = 'utf-8' ) as f:
        for line in sort:
            f.write( line + '\n' )
    return len( sort )

# The main loop for scraping pages defined in config
def scraping () -> None :
    pages: dict = CONFIG.get( 'pages', {} )
    for page, opt in pages.items():
        print( f'>> Scraping for "{page}" ...' )
        rows: int = 0
        if url := resolve_url( opt.get( 'url', '' ) ):
            if stream := get_stream( url ):
                if data := parse_table( stream, opt ):
                    rows = save_to_db( page, opt, data )
        if rows == 1:
            print( f'   ... done [1 entry]' )
        else:
            print( f'   ... done [{rows} entries]' )
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
