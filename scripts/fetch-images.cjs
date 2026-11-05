const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(targetDir, { recursive: true });

const images = [
  {
    name: 'hero-car-wash-foam.jpg',
    url: 'https://images.pexels.com/photos/29922284/pexels-photo-29922284/free-photo-of-luxury-suv-in-modern-car-wash-with-foam.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    name: 'pressure-washer-bay.jpg',
    url: 'https://images.pexels.com/photos/4876669/pexels-photo-4876669.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    name: 'car-detailing-sponge.jpg',
    url: 'https://images.pexels.com/photos/6872157/pexels-photo-6872157.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    name: 'car-snow-foam.jpg',
    url: 'https://images.pexels.com/photos/28995189/pexels-photo-28995189/free-photo-of-luxury-suv-covered-with-soap-at-car-wash.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

function download(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, item.name);
    const file = fs.createWriteStream(dest);
    const getUrl = (u) => {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          getUrl(res.headers.location);
        } else if (res.statusCode === 200) {
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(dest); });
        } else {
          reject(new Error(`Status ${res.statusCode} for ${item.name}`));
        }
      }).on('error', reject);
    };
    getUrl(item.url);
  });
}

(async () => {
  for (const item of images) {
    try {
      const p = await download(item);
      const stat = fs.statSync(p);
      console.log('Downloaded:', item.name, stat.size, 'bytes');
    } catch (e) {
      console.error('Failed:', item.name, e.message);
    }
  }
})();
