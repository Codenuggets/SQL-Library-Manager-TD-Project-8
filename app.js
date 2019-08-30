const express = require('express');
const db = require ('./db');
const { Book } = db.models;

const app = express();

app.set('view engine', 'pug');
app.use('/static', express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/books');
});

app.get('/books', (req, res) => {
  res.render('index');
});

const port = process.env.port || 3000;
app.listen(port, ()=> {
  console.log(`The application is running on port ${port}`);
});
