# Load requirements
from bs4 import BeautifulSoup, Tag
import json
from selenium import webdriver

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

# The main loop for scraping pages defined in config
def scraping () -> None :
    pages: dict = CONFIG.get( 'pages', {} )
    for page, opt in pages.items():
        if url := resolve_url( opt.get( 'url', '' ) ):
            if stream := get_stream( url ):
                if data := parse_table( stream, opt ):
                    print( data )

# The main program loop
def main () -> None :
    if load_config():
        init_driver()
        scraping()
        close_driver()

# Run the program
# Safely execute the main function
if __name__ == '__main__':
    main()
