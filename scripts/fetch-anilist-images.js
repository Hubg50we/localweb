const https = require('https');

function queryAnilist(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { english romaji }
        coverImage { extraLarge large }
        bannerImage
      }
    }
  `;
  const postData = JSON.stringify({ query, variables: { search: title } });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'graphql.anilist.co',
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'HiAnime/5.0'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data && json.data.Media);
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(postData);
    req.end();
  });
}

(async () => {
  const titles = ['Solo Leveling', 'Demon Slayer: Hashira Training Arc', "Frieren: Beyond Journey's End", 'Kaiju No. 8'];
  for (const t of titles) {
    const res = await queryAnilist(t);
    console.log(t, '->', res ? {
      cover: res.coverImage && (res.coverImage.extraLarge || res.coverImage.large),
      banner: res.bannerImage
    } : 'NOT_FOUND');
  }
})();
