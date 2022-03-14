require('dotenv').config();

const urlExists = require("url-exists");

var bodyParser = require('body-parser')
const express = require('express');
const cors = require('cors');
const app = express();

// setup mongoose
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// Define mongoose schema and model
const linkSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: Number
});

let Link = mongoose.model('Link', linkSchema);

// Define functions to create and save new links
const createAndSaveLink = (link, index, done) => {
  let document = new Link({ original_url: link, short_url: index })
  document.save((err, data) => {
    if (err) return console.error(err);
    done(null, data);
  });
};

// Count DB size to generate index
const countDBSize = (done) => {
  Link.estimatedDocumentCount((err, data) => {
    if (err) return console.error(err);
    done(null, data);
  });
};

// FindOne in DB
const findOneByIndex = (index, done) => {
  Link.findOne({ short_url: index }, (err, link) => {
    done(null, link);
    if (err) {
      return console.log('invalid short_url');
    }
  });
};

// Create shourturl post API
app.route("/api/shorturl").post((req, res) => {
  urlExists(req.body.url, (err, exists) => {
    if (exists) {
      countDBSize((_, index) => {
        createAndSaveLink(req.body.url, index + 1, (_, data) => {
          res.json({ original_url: data.original_url, short_url: data.short_url })
        });
      });
    } else {
      res.json({ error: 'invalid url' })
    }
  });

});

// Create short url API
app.get('/api/shorturl/:number', function (req, res) {
  findOneByIndex(req.params.number, (_, link) => {
    if (link) res.redirect(link.original_url);
    else res.json({ error: 'invalid short_url' });
  });
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
