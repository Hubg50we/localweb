const https = require('https');

function queryAniList(anilistId) {
  return new Promise((resolve, reject) => {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { romaji english }
          episodes
          nextAiringEpisode { episode airingAt }
          streamingEpisodes {
            title
            thumbnail
            url
            site
          }
          characters(perPage: 12, sort: ROLE) {
            edges {
              role
              node {
                id
                name { full }
                image { medium large }
              }
              voiceActors(language: JAPANESE) {
                id
                name { full }
                image { medium large }
              }
            }
          }
          trailer {
            id
            site
          }
        }
      }
    `;

    const req = https.request('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(JSON.stringify({ query, variables: { id: anilistId } }));
    req.end();
  });
}

queryAniList(151807).then(data => {
  console.log('Solo Leveling Media data:');
  console.log('Title:', data.data?.Media?.title);
  console.log('Episodes count:', data.data?.Media?.episodes);
  console.log('Streaming episodes count:', data.data?.Media?.streamingEpisodes?.length);
  console.log('First streaming episode:', data.data?.Media?.streamingEpisodes?.[0]);
  console.log('Characters count:', data.data?.Media?.characters?.edges?.length);
  console.log('First character:', data.data?.Media?.characters?.edges?.[0]);
  console.log('Trailer:', data.data?.Media?.trailer);
}).catch(console.error);
