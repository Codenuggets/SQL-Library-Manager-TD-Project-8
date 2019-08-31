const bodyParser = require('body-parser');
const express = require('express');
const db = require ('./db');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { Book } = db.models;


const app = express();

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/static', express.static('public'));

// async function search() {
//   const searchInput = document.querySelector('.search');
//   const results = await Book.findAll({
//     where: {
//       title: {
//         $iLike: `%${searchInput.value}%`,
//       },
//       $or: [
//         {
//           author:
//           {
//             $iLike: `%${searchInput.value}%`,
//           }
//         },
//         {
//           genre:
//           {
//             $iLike: `%${searchInput.value}%`,
//           }
//         }
//       ]
//     }
//   });
//   console.log("hi!");
// }

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

app.post('/books', async(req, res) => {
  try {
    const splitYear = req.body.searchInput.split('');
    const books = await Book.findAll({
      where: {
        [Op.or]: [
          {
            title:
            {
              [Op.like]: `%${req.body.searchInput}%`
            },
          },
          {
            author:
            {
              [Op.like]: `%${req.body.searchInput}%`
            },
          },
          {
            genre:
            {
              [Op.like]: `%${req.body.searchInput}%`
            },
          },
          {
            year:
            {
              [Op.contains]: `${splitYear.map(Number)}`
            }
          },
        ]
      }
    });
    res.render('index', { books });
    res.end();
  } catch (err) {
    console.error('Error searching for books ', err);
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
});

app.get('/books/:id', async (req, res) => {
  try {
    const selectedBook = await Book.findByPk(req.params.id);
    if(selectedBook === null) {
      const err = new Error("Sever Error");
      err.status = 500;
      res.render('error', { err });
    }
    const book = selectedBook.toJSON();
    res.render('update-book', { book });
  } catch (err) {
    console.error("Error grabbing book ", err);
  }
});

app.post('/books/:id', async (req, res) => {
  try {
    const selectedBook = await Book.findByPk(req.params.id);
    await selectedBook.update({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      year: req.body.year
    });
    const book = selectedBook.toJSON();
    res.render('update-book', { book, success: "Successfully updated book!"});
    res.end();
  } catch (err) {
    console.error("Error updating book ", err);
  }
});

app.post('/books/:id/delete', async (req, res) => {
  try {
    const chosenBook = await Book.findByPk(req.params.id);
    console.log('deleting');
    await chosenBook.destroy();
    res.render('new-book', { success: "Successfully deleted book!"});
    res.end();
  } catch (err) {
    console.error("Error deleting book ", err);
  }
});

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.err = err;
  res.status(err.status);
  res.render('page-not-found');
});

const port = process.env.port || 3000;
app.listen(port, ()=> {
  console.log(`The application is running on port ${port}`);
});
