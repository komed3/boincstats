# Load requirements
import json

# Global vars
CONFIG = {}

# Load config file with user info and URLs
def load_config () -> bool :
    global CONFIG
    with open( './config.json', 'r', encoding='utf-8' ) as cfg:
        CONFIG = json.load( cfg )
        return True
    return False

# The main program, does the scraping
def main () -> None :
    load_config()

# Run the program
# Safely execute the main function
if __name__ == '__main__':
    main()