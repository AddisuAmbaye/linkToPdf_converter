const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const unoconv = require('unoconv')
const app = express();
const port = 3000;

app.use(express.json());

app.post('/convert', async (req, res) => {
    const { documentLink } = req.body;

    try {
        // Fetch the document from the link
        const response = await axios.get(documentLink, { responseType: 'arraybuffer' });

        // Write the document content to a temporary file
        const tempFilePath = 'temp_document';
        fs.writeFileSync(tempFilePath, Buffer.from(response.data));

        // Convert the temporary document to PDF using unoconv
        const outputPDF = `${tempFilePath}.pdf`;
        const command = `unoconv -f pdf -o ${outputPDF} ${tempFilePath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                res.status(500).json({ error: 'Conversion failed' });
                return;
            }

            // Send the converted PDF file as a response
            res.sendFile(outputPDF, { root: __dirname }, () => {
                // Clean up: remove temporary files
                fs.unlinkSync(tempFilePath);
                fs.unlinkSync(outputPDF);
            });
        });
    } catch (error) {
        console.error(`Error fetching the document: ${error.message}`);
        res.status(500).json({ error: 'Document fetch failed' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
