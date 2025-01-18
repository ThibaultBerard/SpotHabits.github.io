import json
import requests
from spotipy.oauth2 import SpotifyOAuth
from tkinter import filedialog
from tqdm import tqdm 
import time

CLIENT_ID = '7bae935566d648d38283f62986ad9625'
CLIENT_SECRET = 'ebb188d363f4423ca406d4f68413fdd9'
REDIRECT_URI = 'http://localhost:8888/callback/'  
SCOPES = 'user-library-read'

sp = SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope=SCOPES
)

def get_artist_genres(artist_name):
    try:
        token_info = sp.get_cached_token()
        if not token_info:
            token_info = sp.refresh_access_token(sp.get_access_token())

        headers = {"Authorization": f"Bearer {token_info['access_token']}"}
        search_url = "https://api.spotify.com/v1/search"
        params = {"q": artist_name, "type": "artist", "limit": 1}

        response = requests.get(search_url, headers=headers, params=params)
        if response.status_code == 200:
            artists = response.json().get("artists", {}).get("items", [])
            if artists:
                return artists[0].get("genres", [])
        else:
            print(f"Error for {artist_name}: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Network error or exception: {e}")
    
    return []

def enrich_my_data(history_file, output_file):
    with open(history_file, "r", encoding="utf-8") as f:
        history = json.load(f)

    updated_history = []
    processed_artists = {}

    for entry in tqdm(history, desc="Processing"):
        artist_name = entry["master_metadata_album_artist_name"]

        if artist_name not in processed_artists:
            processed_artists[artist_name] = get_artist_genres(artist_name)

        entry["genres"] = processed_artists[artist_name]
        updated_history.append(entry)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(updated_history, f, indent=4, ensure_ascii=False)

    print(f"File saved in {output_file}")


if __name__ == "__main__":
    input_file = filedialog.askopenfilename(
        filetypes=[('json files', '*.json')], 
        title='Choose your streaming history file'
    )
    output_file = "Enriched_Streaming_History_donnees_fus.json"  
    enrich_my_data(input_file, output_file)
