const bodyParser = require('body-parser');
const express = require('express');
const db = require ('./db');
const { Book } = db.models;

const app = express();

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/static', express.static('public'));

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Success!');
  } catch (error) {
    console.error('Error connecting, ', error);
  }
})();

app.get('/', (req, res) => {
  res.redirect('/books');
});

app.get('/books', async (req, res) => {
  try {
    const allBooks = await Book.findAll();
    const books = allBooks.map(book => book.toJSON());
    res.render('index', { books });
  } catch (err) {
    console.error('Error grabbing books ', err);
  }
});

app.get('/books/new', (req, res) => {
  res.render('new-book');
});

app.post('/books/new', async (req, res) => {
  try {
    await Book.create({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      year: req.body.year
    });
    res.render('new-book', { success: "Successfully added book!"});
    res.end();
  } catch (err) {
    if(err.name === 'SequelizeValidationError'){
      const errors = err.errors.map(error => error.message);
      res.render('new-book', { errors });
      res.end();
    };
  }
})

app.get('/books/:id', async (req, res) => {
  try {
    const selectedBook = await Book.findByPk(req.params.id);
    const book = selectedBook.toJSON();
    res.render('update-book', { book });
  } catch (err) {
    console.error("Error grabbing book ", err);
  }
})

const port = process.env.port || 3000;
app.listen(port, ()=> {
  console.log(`The application is running on port ${port}`);
});
