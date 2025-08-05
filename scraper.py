from bs4 import BeautifulSoup, Tag
import csv
import json
import os
import requests

CFG = './config.json'
DBM = './db'

def load_config ( path: str ) :
    with open( path, 'r', encoding='utf-8' ) as cfg:
        return json.load( cfg )

def ensure_db_folder ( path: str ) :
    os.makedirs( path, exist_ok=True )

def get_url ( config, key: str ) :
    if key in config[ 'urls' ]:
        url = config[ 'urls' ][ key ]
        for k in [ 'cpid', 'uid', 'username' ]:
            url.replace( '$' + k, config[ k ] )
        return url
    return None

def open_stream ( path: str ) :
    with requests.get( path ) as response:
        return response.text

def parse_table ( html: str, id: str ) :
    soup = BeautifulSoup( html, 'html.parser' )
    table = soup.find( 'table', { 'id': id } )
    data = []
    if table and isinstance( table, Tag ):
        for row in table.find_all( 'tr' )[ 1: ]:
            if not isinstance( row, Tag ):
                continue
            if cols := [ td.get_text( strip=True ) for td in row.find_all( 'td' ) ]:
                data.append( cols )
    return data

def main () :
    config = load_config( CFG )
    ensure_db_folder( DBM )

    if url := get_url( config, 'lastDays' ):
        if stream := open_stream( url ):
            data = parse_table( stream, 'tblStats' )

if __name__ == '__main__':
    main()