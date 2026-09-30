const sharp = require('sharp');
const fs = require('fs');

async function processLogos() {
  const mask = Buffer.from(
    '<svg width="862" height="886"><circle cx="431" cy="443" r="428" fill="#fff"/></svg>'
  );

  await sharp('public/mariyam_kids_world_logo.png')
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile('public/mariyam_kids_world_logo_transparent.png');

  console.log('Generated public/mariyam_kids_world_logo_transparent.png');
}

processLogos().catch(console.error);
