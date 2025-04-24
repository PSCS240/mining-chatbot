const express = require('express');
const { Translate } = require('@google-cloud/translate').v2;

// Initialize Google Cloud Translate
const translate = new Translate({
    projectId: 'your-project-id',
    keyFilename: 'path/to/your/credentials.json'
});

app.post('/translate', async (req, res) => {
    try {
        const { text, targetLang } = req.body;
        const [translation] = await translate.translate(text, targetLang);
        res.json({ translatedText: translation });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});
