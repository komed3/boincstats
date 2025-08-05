import os
import json
import csv
from bs4 import BeautifulSoup

CFG = './config.json'
DBM = './db'

def load_config ( path ) :
    with open( path, 'r', encoding='utf-8' ) as f:
        return json.load( f )

def ensure_db_folder ( path ) :
    os.makedirs( path, exist_ok=True )

def main () :
    config = load_config( CFG )
    ensure_db_folder( DBM )

if __name__ == '__main__':
    main()