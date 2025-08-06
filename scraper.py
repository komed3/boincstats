# Load requirements
from bs4 import BeautifulSoup, Tag
import json
import requests

# Global vars
CONFIG: dict = {}

# Load config file with user info and URLs
def load_config () -> bool :
    global CONFIG
    with open( './config.json', 'r', encoding='utf-8' ) as cfg:
        CONFIG = json.load( cfg )
        return True
    return False

# Resolves an URL and replace dynamic vars, like UID or username
def get_url ( url: str ) -> str :
    for k in [ 'cpid', 'uid', 'username' ]:
        url = url.replace( '$' + k, CONFIG.get( k, '' ) )
    return url

# Opens a stream from a URL and returns the content
def open_stream ( url: str ) -> ( str | None ) :
    with requests.get( url ) as response:
        return response.text
    return None

def parse_table ( stream: str, opt: dict ) -> ( dict | None ) :
    soup = BeautifulSoup( stream, 'html.parser' )
    table = soup.find( id = opt.get( 'id', '' ) )
    print( soup )
    data: dict = {}
    if table and isinstance( table, Tag ):
        tbody = table.find( 'tbody' )
        if tbody and isinstance( tbody, Tag ):
            for row in tbody.find_all( 'tr' ):
                if not isinstance( row, Tag ):
                    continue
                if cols := [ td.get_text( strip=True ) for td in row.find_all( 'td' ) ]:
                    print( cols )
    return None

# The main loop for scraping pages from config
def scraping () -> None :
    pages: dict = CONFIG.get( 'pages', {} )
    for page, opt in pages.items():
        if url := get_url( opt.get( 'url', '' ) ):
            if stream := open_stream( url ):
                if data := parse_table( stream, opt ):
                    print( data )

# The main program loop
def main () -> None :
    if load_config():
        scraping()

# Run the program
# Safely execute the main function
if __name__ == '__main__':
    main()