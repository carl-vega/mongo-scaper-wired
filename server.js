// Dependencies
const express = require("express");
const mongoose = require("mongoose"); //Mongo object modelling
const cheerio = require("cheerio"); //Scraper
const exphbs = require("express-handlebars"); //Handlebars
const axios = require("axios"); //Axios is a scrapping tool
const logger = require("morgan");
const P = require("bluebird");
const _ = require("lodash");

// Require all models
const db = require("./models");

const PORT = 3000; //process.env.PORT || process.argv[2] ||

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
// Connect to the Mongo DB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/home",
  { useNewUrlParser: true }
);
// // Connect to the Mongo DB
// mongoose.Promise = Promise;
// mongoose.connect(MONGODB_URI);

// Handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes---------------------------------
app.get("/", function(req, res) {
  res.render("index");
});

app.get("/saved", function(req, res) {
  res.render("saved");
});

app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios

  axios
    .get("https://www.wired.com/")
    .then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      const $ = cheerio.load(response.data);
      $("footer").remove();

      // Now, we grab every article:
      let articles = $("div.homepage-main h5")
        .map((i, h5) => {
          // Save an empty result object
          let result = {};
          result.title = $(h5).text();
          result.link = `http://www.wired.com${$(h5)
            .closest("a")
            .attr("href")}`;
          result.byline = $(h5)
            .siblings(".byline-component")
            .find(".visually-hidden")
            .first()
            .text();
          result.image = $(h5)
            .parent()
            .parent()
            .find("img")
            .attr("src");
          return result;
        })
        .splice(0)
        .filter(a => !!a.image);

      articles = _.uniq(_.uniq(articles, a => a.title), a => a.link);

      return P.each(articles, a => {
        return db.Article.findOneAndUpdate({ link: a.link }, a, {
          upsert: true,
          new: true,
          runValidators: true
        });
      });
    })
    .then(result => {
      console.log(result);
      res.send({ countNum: result.length });
    })
    .catch(err => {
      console.error(err);
      res.send(err);
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Article.find()
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/saved", function(req, res) {
  db.Article.find({ saved: true })
    .sort({ _id: -1 })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      db.Article.findOne({ _id: req.params.id })
        .then(function(dbArticle) {
          let notesArray = dbArticle.note;
          notesArray.push(dbNote._id);
          return db.Article.findOneAndUpdate(
            { _id: req.params.id },
            { note: notesArray },
            { new: true }
          );
        })
        .catch(function(err) {
          res.json(err);
        });
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/save/:id", function(req, res) {
  // Updates the saved value to true for one article using the req.params.id
  db.Article.updateOne({ _id: req.params.id }, { saved: true }, function(
    dbArticle
  ) {
    res.json(dbArticle);
  }).catch(function(err) {
    res.json(err);
  });
});

// Route for saving/updating an Article's associated Note
app.post("/note/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { note: dbNote._id } },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.delete("/note/:id", function(req, res) {
  db.Note.deleteOne({ _id: req.params.id }, function(dbNote) {
    res.json(dbNote);
  }).catch(function(err) {
    res.json(err);
  });
});

// Start the server
app.listen(PORT, function() {
  console.log(
    `This application is running on port: ${PORT}  http://localhost:${PORT}`
  );
});
