// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use(express.static('public'));
app.get('/', async (req, res) => {
  try {
    fs.readFile('bond.json', 'utf8', (err, data) => {
        if (err) {
          throw err;
        }
        const bonds = JSON.parse(data);
        res.json(bonds);
      });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});
app.get("/bonds", (req, res) => {
  fs.readFile('alerts.json', 'utf8', (err, data) => {
    if (err) {
      throw err;
    }
    const bonds = JSON.parse(data);
    res.json(bonds);
  });
});
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
