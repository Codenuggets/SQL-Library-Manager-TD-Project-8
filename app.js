const bodyParser = require('body-parser');
const express = require('express');
const db = require ('./db');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { Book } = db.models;


const app = express();

app.set('view engine', 'pug');
// Sets up bodyParser middleware to read the body of requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/static', express.static('public'));

// redirects to /books from root url
app.get('/', (req, res) => {
  res.redirect('/books');
});

// Displays full list of books that are paginated
app.get('/books', async (req, res) => {
  try {
    //initializes page variable to be used, in case there is no query to set the value yet
    let page = 1;
    //Checks if there is a query for page and sets page to that query value
    if(req.query.page) {
      page = req.query.page;
    }
    // Paginates the books returned from the database using page
    const pagedBooks = await Book.findAll({
      limit: 5,
      offset: (5 * page)
    });
    const books = pagedBooks.map(book => book.toJSON());
    // Grabs all the books with no params to generate correct amount of page links
    const allBooks = await Book.findAll();
    const booksForPages = allBooks.map(book => book.toJSON());
    // Declares empty array to be used to push how many page links need to be generated in the pug template
    let pages = [];
    for(let i = 1; i <= Math.floor(booksForPages.length/5); i++) {
      pages.push(i)
    }
    res.render('index', { books, pages });
  } catch (err) {
    console.error('Error grabbing books ', err);
  }
});

// Post route for books and handles the search for books, author, etc
app.post('/books', async(req, res) => {
  try {
    // Sequelize.Op library used to handle multiple search criteria
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
              [Op.like]: `%${req.body.searchInput}%`
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

// Renders the new book view for users to add a book to the database
app.get('/books/new', (req, res) => {
  res.render('new-book');
});

// POST route for creating a new book
app.post('/books/new', async (req, res) => {
  try {
    // grabs the information in the form and applies it to the appropriate columns
    await Book.create({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      year: req.body.year
    });
    res.render('new-book', { success: "Successfully added book!"});
    res.end();
  } catch (err) {
    // Checks to see that it's a Validation Error
    if(err.name === 'SequelizeValidationError'){
      // If so the error messages are passed into the error object, the page is rerendered with the message displayed for the user
      const errors = err.errors.map(error => error.message);
      res.render('new-book', { errors });
      res.end();
    };
  }
});

// Shows the specific book corresponding with the id passed in
app.get('/books/:id', async (req, res) => {
  try {
    // Book is grabbed by it's id grabbed with req.params.id
    const selectedBook = await Book.findByPk(req.params.id);
    // Checks to make sure there is actually a book returned before trying to convert to JSON
    if(selectedBook === null) {
      //If there is no book, the error page is displayed with a 500 Status Code
      const err = new Error("Sever Error");
      err.status = 500;
      res.render('error', { err });
    }
    // The selected book is converted to json and passed into the render method
    const book = selectedBook.toJSON();
    res.render('update-book', { book });
  } catch (err) {
    console.error("Error grabbing book ", err);
  }
});

// POST route for updating a book's info
app.post('/books/:id', async (req, res) => {
  try {
    //First the book is selected by it's id and then updated with the update mehtod
    const selectedBook = await Book.findByPk(req.params.id);
    await selectedBook.update({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      year: req.body.year
    });
    // The book is then converted to JSON and passed into the page that is rerendered with a success message to let the user know the book was Successfully added
    const book = selectedBook.toJSON();
    res.render('update-book', { book, success: "Successfully updated book!"});
    res.end();
  } catch (err) {
    console.error("Error updating book ", err);
  }
});

// POST Route for deleting a book
app.post('/books/:id/delete', async (req, res) => {
  try {
    // First the book is selected by it's id
    const chosenBook = await Book.findByPk(req.params.id);
    // Then the book is deleted with the destroy method, the new-book view is rendered with a message letting the user know they Successfully deleted the book
    await chosenBook.destroy();
    res.redirect('/books');
    res.end();
  } catch (err) {
    console.error("Error deleting book ", err);
  }
});

// Middleware to handle 404 errors
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Middleware to handle any errors passed to it from next()
app.use((err, req, res, next) => {
  res.locals.err = err;
  res.status(err.status);
  res.render('page-not-found');
});

const port = process.env.port || 3000;
app.listen(port, ()=> {
  console.log(`The application is running on port ${port}`);
});
