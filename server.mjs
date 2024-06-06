import express from 'express';
import bodyParser from 'body-parser';
import fetchTrendingTopics from './scraper.mjs';


const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/run-script', async (req, res) => {
    try {
        const record = await fetchTrendingTopics();
        console.log('Record:', record); // Add this line to log the record
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
