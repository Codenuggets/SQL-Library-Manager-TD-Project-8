const db = require ('./db');
const { Book } = db.models;

(async () => {
  try {
    const allBooks = await Book.findAll();
    console.log(allBooks.map(book => book.toJSON()));
  } catch (error) {
    console.error('Error connecting, ', error);
  }
}) ();
