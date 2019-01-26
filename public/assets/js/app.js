// Grab the articles as a json
$.getJSON("/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page

    $("#articles").append(
      `<div class="card bg-dark text-white" data-id="${data[i]._id}">
      <img class="card-img-top" src="${data[i].image}" alt="Card image">
      <div class="card-body">
      <h5 class="card-title">${data[i].title}</h5>
      <p class="card-text"><a href="${data[i].link}">
      Check out the Story Here
      </a>
      <svg class="bookmark" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M5 0v24l7-6 7 6v-24h-14zm1 1h12v20.827l-6-5.144-6 5.144v-20.827z"/></svg>
      </p> 
      </div>`
    );
  }
});

//if scrape is clicked
$("#scrape").on("click", function() {
  var prevLength = 0;
  var finalLength = 0;
  //get the original number of articles
  $.ajax({
    method: "GET",
    url: "/articles",
    success: function(data) {
      prevLength = data.length;
    }
  }).then(function() {
    //then scrape the new articles, calculate the difference in number of articles and display, then reload the index page
    $.ajax({
      method: "GET",
      url: "/scrape",
      success: function(data) {
        finalLength = data.countNum;
        var diff = finalLength - prevLength;
        $("#modalBody").text(diff + " articles were added.");
        $("#myModal").modal("show");
        setTimeout(function() {
          window.location.href = "/";
        }, 3000);
      }
    });
  });
});

// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append(
        "<button data-id='" + data._id + "' id='savenote'>Save Note</button>"
      );

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});
