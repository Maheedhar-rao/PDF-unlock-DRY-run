const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(__dirname)); // serve index.html

app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const inputPath = req.file.path;

    const fileBuffer = fs.readFileSync(inputPath);
    const originalPdf = await PDFDocument.load(fileBuffer, {
      ignoreEncryption: true,
    });

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(originalPdf, originalPdf.getPageIndices());

    copiedPages.forEach((page) => newPdf.addPage(page));

    const cleanedBuffer = await newPdf.save();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=cleaned.pdf',
    });

    res.send(cleanedBuffer);
    fs.unlinkSync(inputPath); // cleanup temp file
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to process PDF');
  }
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
