let accessToken = '';
const clientId = '5c2d1d6e0a524f46a20efd8aa48900cc';
const redirectUri = 'http://like-milk.surge.sh';

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expirationTimeMatch = window.location.href.match(/expires_in=([^&]*)/);

    if (accessTokenMatch && expirationTimeMatch) {
      accessToken = accessTokenMatch[1];
      const expirationTime = Number(expirationTimeMatch[1]);

      window.setTimeout(() => accessToken = '', expirationTime * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
      window.location = accessUrl;
    }
  },

  async search(term) {
    const endpoint = `https://api.spotify.com/v1/search?type=track&q=${term}`;
    const accessToken = Spotify.getAccessToken();

    try {
      const response = await fetch(endpoint, {
        headers: {Authorization: `Bearer ${accessToken}`}
      });
      if (response.ok) {
        const jsonResponse = await response.json();

        if (jsonResponse.tracks) {
          return jsonResponse.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri
          }));
        } else {
          return [];
        }
      }

    } catch (error) {
      console.log(error);
    }
  },

  async savePlaylist(name, trackUris) {
    if (!name || !trackUris.length) {
      return;
    }
    
    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    let userId;

    try {
      const responseOne = await fetch('https://api.spotify.com/v1/me', { headers: headers });
      if (responseOne.ok) {
        const jsonResponseOne = await responseOne.json();
        userId = jsonResponseOne.id;

        const responseTwo = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
          headers: headers,  
          method: 'POST',
          body: JSON.stringify({ name: name })
        });
        if (responseTwo.ok) {
          const jsonResponseTwo = await responseTwo.json();
          let playlistId = jsonResponseTwo.id;

          const responseThree = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({ uris: trackUris })
          });
          if (responseThree.ok) {
            const jsonResponseThree = await responseThree.json();
            playlistId = jsonResponseThree.id;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
};

export default Spotify;