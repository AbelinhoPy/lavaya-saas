const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'images');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'));

(async () => {
  for (const f of files) {
    const src = path.join(dir, f);
    const dst = path.join(dir, f.replace('.jpg', '.webp'));
    await sharp(src).webp({ quality: 82 }).toFile(dst);
    const s1 = fs.statSync(src).size;
    const s2 = fs.statSync(dst).size;
    console.log(f, s1, '->', path.basename(dst), s2, 'bytes (' + Math.round((1 - s2/s1)*100) + '% saved)');
  }
})();
