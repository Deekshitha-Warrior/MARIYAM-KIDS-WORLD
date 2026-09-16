const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function convertPdfToPng(pdfPath, outRawPng, outCroppedPng) {
  console.log(`Converting ${pdfPath} to PNG...`);
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({
    viewport: { width: 2400, height: 2400 },
    deviceScaleFactor: 2
  });

  const fileUrl = 'file:///' + path.resolve(pdfPath).replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: outRawPng, fullPage: true });
  await browser.close();
  console.log(`Saved raw screenshot to ${outRawPng}`);

  // Now use sharp to trim borders
  const image = sharp(outRawPng);
  const metadata = await image.metadata();
  console.log(`Raw dimensions: ${metadata.width}x${metadata.height}`);

  await sharp(outRawPng)
    .trim()
    .toFile(outCroppedPng);

  const croppedMeta = await sharp(outCroppedPng).metadata();
  console.log(`Cropped dimensions: ${croppedMeta.width}x${croppedMeta.height} saved to ${outCroppedPng}`);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const tajPdf = path.join(publicDir, 'TAJ_TEXTILES_PRINT_HD.pdf');
  const mariyamPdf = path.join(publicDir, 'Mariyam_Kids_World_Logo_HD.pdf');

  if (fs.existsSync(tajPdf)) {
    await convertPdfToPng(
      tajPdf,
      path.join(publicDir, 'taj_raw.png'),
      path.join(publicDir, 'taj_textiles_logo.png')
    );
  }

  if (fs.existsSync(mariyamPdf)) {
    await convertPdfToPng(
      mariyamPdf,
      path.join(publicDir, 'mariyam_raw.png'),
      path.join(publicDir, 'mariyam_kids_world_logo.png')
    );
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
