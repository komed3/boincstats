from bs4 import BeautifulSoup
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
    if key in config.urls:
        return config.urls[ key ]
    return None

def open_stream ( path: str ) :
    with requests.get( path ) as response:
        return response.text

def parse_table ( html: str, id: str ) :
    soup = BeautifulSoup( html, 'html.parser' )
    table = soup.find( 'table', { 'id': id } )
    if not table:
        return []
    rows = table.find_all( 'tr' )[1:]
    data = []
    for row in rows:
        cols = [ td.get_text( strip=True ) for td in row.find_all( 'td' ) ]
        if cols:
            data.append( cols )
    return data

def main () :
    config = load_config( CFG )
    ensure_db_folder( DBM )

if __name__ == '__main__':
    main()