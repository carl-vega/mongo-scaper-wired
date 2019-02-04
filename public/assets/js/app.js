// Grab the articles as a json
$.getJSON("/api/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page

    $("#articles").append(
      `
      <div class="card bg-dark text-white">
      <img class="card-img-top" src="${data[i].image}" alt="Card image">
      <div class="card-body">
      <h5 class="card-title">${data[i].title}</h5>
      <div class="card-footer">
      <a href="${data[i].link}">Check out the Story Here</a>
      <i class="material-icons float-right saveArticle clickable" data-id="${
        data[i]._id
      }">sentiment_very_satisfied</i>
      </div>
      </div>
      `
    );
  }

  //if scrape is clicked
  $(document).on("click", "#scrape", function() {
    var prevLength = 0;
    var finalLength = 0;
    //get the original number of articles
    $.ajax({
      method: "GET",
      url: "/api/articles",
      success: function(data) {
        prevLength = data.length;
      }
    }).then(function() {
      //then scrape the new articles, calculate the difference in number of articles and display, then reload the index page
      $.ajax({
        method: "GET",
        url: "/api/scrape",
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

  $(document).on("click", ".saveArticle", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");

    // Run a POST request to update saved to true
    $.ajax({
      method: "POST",
      url: "/api/save/" + thisId,
      success: function(_data) {
        $("#modalBody").text("Article was added to the Saved Articles page.");
        $("#myModal").modal("show");
      }
    });
  });
});

//function to display notes in modal
function displayNotes(data) {
  //clear the notes
  $("#notesBody").empty();
  //if a note array exists
  if (data.note.length !== 0) {
    for (var i = 0; i < data.note.length; i++) {
      // get the body of the note and the associated x that will allow you to delete the note
      let noteP = $("<h6>").text(data.note[i].body);
      let span = $("<span>");
      span.addClass("deleteNote");
      span.addClass("float-right");
      span.html("&times;");
      span.attr("data-id", data.note[i]._id);
      noteP.append(span);
      $("#notesBody").append(noteP);
    }
  } else {
    $("#notesBody").text("No new notes for this article yet.");
  }
}

// When you click the deletenote button
$(document).on("click", ".deleteNote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  var articleId = $(".saveNote").attr("data-id");
  //update the notes array in the article to remove the note objectid
  $.ajax({
    method: "PUT",
    url: "api/articles/" + articleId + "/" + thisId
  }).then(function(data) {
    //then delete the note document
    $.ajax({
      method: "DELETE",
      url: "api/note/" + thisId
    });
    //delete the deleted note from the data returned in the article before the update
    var deleteItem = false;
    var deleteIndex = 0;
    for (var i = 0; i < data.note.length; i++) {
      if (data.note[i]._id === thisId) {
        deleteItem = true;
        deleteIndex = i;
      }
    }
    if (deleteItem) {
      data.note.splice(deleteIndex, 1);
    }
    //update the notes display in the modal
    displayNotes(data);
    // $("#notes-title").text(`Notes For Article: ${$(this).attr("title")}`);
    $("#notesModal").modal("show");
  });
});

// Grab the saved articles as a json
$.getJSON("/api/saved", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $("#savedArticles").append(
      `
      <div class="container">
      <div class="card bg-dark text-white">
        <img class="card-img-top" src="${data[i].image}" alt="Card image" />
        <div class="card-body">
          <h5 class="card-title">${data[i].title}</h5>
          <div class="card-footer">
          <a href="${data[i].link}"> Check out the Story Here </a>
          <i class="material-icons float-right articleNote clickable" title="${
            data[i].title
          }" data-id="${data[i]._id}">note_add</i>
          <i class="material-icons float-right deleteSave clickable" data-id="${
            data[i]._id
          }">delete_outline</i>
          </div>  
        </div>
      </div>
      </div>
      `
    );
  }
  $(document).on("click", ".zoom-btn-large", function() {
    $(this)
      .find("+ .zoom-menu .zoom-btn-sm")
      .toggleClass("scale-out");
  });

  // When you click the articlenote button
  $(document).on("click", ".articleNote", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");

    $.ajax({
      method: "GET",
      url: "/api/articles/" + thisId
    })
      // With that done, add the note information to the modal and display all notes
      .then(function(data) {
        displayNotes(data);
      });
    $(".saveNote").attr("data-id", thisId);
    $("#notes-title").text(`Notes For Article: ${$(this).attr("title")}`);
    $("#notesModal").modal("show");
  });

  // When you click the deletesave button
  $(document).on("click", ".deleteSave", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");

    // Run a POST request to update saved to false
    $.ajax({
      method: "POST",
      url: "/api/deletesave/" + thisId
    })
      // With that done, reload the saved page
      .then(function(data) {
        window.location.href = "/saved";
      });
  });
});

// When you click the saveNote button
$(document).on("click", ".saveNote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/api/articles/" + thisId,
    data: {
      // Value taken from note textarea
      body: $("#bodyInput").val()
    }
  }).then(function(data) {
    $("#notesModal").modal("hide");
  });
  $("#bodyInput").val("");
});

$(".tooltipped").tooltip({ delay: 50 });
