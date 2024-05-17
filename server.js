const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 4000;

app.use(bodyParser.json());


const db = new sqlite3.Database(':memory:'); 

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, name TEXT, img TEXT, summary TEXT)");

  const initialData = [
    {
      name: "Harry Potter and the Order of the Phoenix",
      img: "https://bit.ly/2IcnSwz",
      summary: "Harry Potter and Dumbledore's warning about the return of Lord Voldemort is not heeded by the wizard authorities who, in turn, look to undermine Dumbledore's authority at Hogwarts and discredit Harry."
    },
    {
      name: "The Lord of the Rings: The Fellowship of the Ring",
      img: "https://bit.ly/2tC1Lcg",
      summary: "A young hobbit, Frodo, who has found the One Ring that belongs to the Dark Lord Sauron, begins his journey with eight companions to Mount Doom, the only place where it can be destroyed."
    },
    {
      name: "Avengers: Endgame",
      img: "https://bit.ly/2Pzczlb",
      summary: "Adrift in space with no food or water, Tony Stark sends a message to Pepper Potts as his oxygen supply starts to dwindle. Meanwhile, the remaining Avengers -- Thor, Black Widow, Captain America, and Bruce Banner -- must figure out a way to bring back their vanquished allies for an epic showdown with Thanos -- the evil demigod who decimated the planet and the universe."
    }
  ];

  const insertStmt = db.prepare("INSERT INTO books (name, img, summary) VALUES (?, ?, ?)");
  initialData.forEach(book => {
    insertStmt.run(book.name, book.img, book.summary);
  });
  insertStmt.finalize();
});


app.get('/', (req, res) => {
  res.send('Welcome to the Book API!');
});


app.get('/books', (req, res) => {
  db.all("SELECT * FROM books", (err, rows) => {
    if (err) {
      console.error('Error getting books:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

app.get('/books/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM books WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error('Error getting book by ID:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (!row) {
      res.status(404).json({ error: 'Book not found' });
    } else {
      res.json(row);
    }
  });
});

app.post('/books', (req, res) => {
  const { name, img, summary } = req.body;
  db.run("INSERT INTO books (name, img, summary) VALUES (?, ?, ?)", [name, img, summary], function(err) {
    if (err) {
      console.error('Error inserting book:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

app.put('/books/:id', (req, res) => {
  const id = req.params.id;
  const { name, img, summary } = req.body;
  db.run("UPDATE books SET name = ?, img = ?, summary = ? WHERE id = ?", [name, img, summary, id], function(err) {
    if (err) {
      console.error('Error updating book:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Book not found' });
    } else {
      res.json({ message: 'Book updated' });
    }
  });
});

app.delete('/books/:id', (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM books WHERE id = ?", [id], function(err) {
    if (err) {
      console.error('Error deleting book:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Book not found' });
    } else {
      res.json({ message: 'Book deleted' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
