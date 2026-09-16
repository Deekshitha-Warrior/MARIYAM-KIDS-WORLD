const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function renderPdfWithPdfJs(pdfPath, outPngPath) {
  console.log(`Rendering ${pdfPath} via PDF.js in headless browser...`);
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();

  const pdfData = fs.readFileSync(pdfPath);
  const base64Data = pdfData.toString('base64');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          body { margin: 0; padding: 0; background: transparent; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <canvas id="the-canvas"></canvas>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdfData = atob("${base64Data}");
          const loadingTask = pdfjsLib.getDocument({ data: pdfData });
          
          window.renderPdf = async function() {
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const scale = 3.0;
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.getElementById('the-canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            await page.render(renderContext).promise;
            return { width: canvas.width, height: canvas.height };
          };
        </script>
      </body>
    </html>
  `;

  await page.setContent(htmlContent);
  const dims = await page.evaluate(async () => {
    return await window.renderPdf();
  });
  console.log('PDF.js rendered dimensions:', dims);

  const canvasHandle = await page.$('#the-canvas');
  const buffer = await canvasHandle.screenshot({ omitBackground: true });
  await browser.close();

  // Trim whitespace with Sharp
  await sharp(buffer)
    .trim()
    .toFile(outPngPath);

  const meta = await sharp(outPngPath).metadata();
  console.log(`Successfully created cropped logo: ${meta.width}x${meta.height} at ${outPngPath}`);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const tajPdf = path.join(publicDir, 'TAJ_TEXTILES_PRINT_HD.pdf');
  const mariyamPdf = path.join(publicDir, 'Mariyam_Kids_World_Logo_HD.pdf');

  if (fs.existsSync(tajPdf)) {
    await renderPdfWithPdfJs(tajPdf, path.join(publicDir, 'taj_textiles_logo.png'));
  }
  if (fs.existsSync(mariyamPdf)) {
    await renderPdfWithPdfJs(mariyamPdf, path.join(publicDir, 'mariyam_kids_world_logo.png'));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
