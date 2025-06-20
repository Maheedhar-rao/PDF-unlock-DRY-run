const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(__dirname));

app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const fileBuffer = fs.readFileSync(inputPath);
    console.log(`Uploaded file: ${req.file.originalname} (${fileBuffer.length} bytes)`);

    let originalPdf;
    try {
      originalPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    } catch (err) {
      console.error('Failed to load PDF:', err.message);
      return res.status(400).send('Could not load PDF. Possibly too encrypted.');
    }

    const pageIndices = originalPdf.getPageIndices();
    if (pageIndices.length === 0) {
      return res.status(400).send('No pages found in PDF.');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    console.log(`Copied ${copiedPages.length} pages.`);

    const cleanedBuffer = await newPdf.save();

    // Save locally for debug
    fs.writeFileSync('cleaned_debug.pdf', cleanedBuffer);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=cleaned.pdf',
    });
    res.send(cleanedBuffer);

    fs.unlinkSync(inputPath); // delete temp uploaded file
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).send('Internal error');
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
