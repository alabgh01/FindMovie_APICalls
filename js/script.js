/* jshint esversion: 8 */
/* jshint browser: true */
/* jshint node: true */
'use strict';

// load for retrieval from youtube
gapi.load("client", loadClient);
  
function loadClient() {
    gapi.client.setApiKey(config.GoogleAPIKey);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
        .then(function() { console.log("GAPI client loaded for API"); },
                function(err) { console.error("Error loading GAPI client for API", err); });
}

// will be use for getting data from movie information api
async function getData(url) {
    return fetch(url)
    .then(response => response.json())
    .catch(error => console.log(error));
}

// get info for the movie or tv series with the provided name and year
async function getDetails(name, year, resultsDiv) {
    
    // if wither name or year is missing, get a warning, nothing else happen
    if (!name | !year){
        let validAl = document.createElement("p");
        validAl.setAttribute("id", "feedbackMessage");
        validAl.setAttribute("class", "alert alert-danger");
        validAl.setAttribute("role", "alert");
        validAl.innerHTML = "Make sure you provided name and year.";
        resultsDiv.appendChild(validAl);
    }
    // if all fields filled get info
    else{
        resultsDiv.innerHTML = "";

        let movieDetails = {};
        let preLoadedMovie = loadMovie(name, year);
    
        // if movie is in storage, get info from there
        if (preLoadedMovie){
            console.log("picking from storage");
            movieDetails = preLoadedMovie.details;
        }
        // else send a new api request
        else{
            console.log("sending api request");
            movieDetails =  await getData(
                `https://www.omdbapi.com/?t=${name}&y=${year}&apikey=${config.OMDBAPIKey}`
            );
        }
    
        let infoDiv = document.createElement("div");
        infoDiv.setAttribute("class", "alert alert-secondary col");
        infoDiv.style.background = "rgba(0, 0, 0, 0.6)";
        infoDiv.style.color = "white";
        infoDiv.style.borderColor = "black";
    
        let outputHead = document.createElement("h4");
        outputHead.innerText = "Information";
        infoDiv.appendChild(outputHead);
    
        for (let [key, value] of Object.entries(movieDetails)){
    
            if (key != "Ratings" & key != "Poster"){
                let detail = document.createElement("p");
                detail.innerHTML = `${key}: ${value}`;
                infoDiv.appendChild(detail);
                resultsDiv.appendChild(infoDiv);
            }
        }
        // call getMovie trailer and feed it with movie info to get a video from youtube about the trailer
        getMovieTrailer(movieDetails.Title, movieDetails.Year, resultsDiv, movieDetails, preLoadedMovie);   
    }
    
}

// function for getting the movie trialer associeted with info given
// will use youtube api
async function getMovieTrailer(name, year, trailerResDiv, movieDetails, preLoadedMovie){

    let resultTrailer = {};

    // if local storage contains movie, then get trailer from there
    if (preLoadedMovie){
        console.log("TRAILER from storage");
        resultTrailer = preLoadedMovie.trailer;
    }
    // else send a new api request
    else{
        let searchString = `${name} ${year} trailer`;
        let maxresult = 1;
        let orderby = "relevance";
    
        var arr_search = {
            "part": 'snippet',
            "type": 'video',
            "order": orderby,
            "maxResults": maxresult,
            "q": searchString
        };
    
        await gapi.client.youtube.search.list(arr_search)
        .then(function(response) {
            resultTrailer = response.result.items;
        },
        function(err) { console.error("Execute error", err); });
    }

    if (resultTrailer) {
        let output = document.createElement("div");
        output.setAttribute("id", "resulted-trailer");
        output.style.background = "rgba(0, 0, 0, 0.6)";
        output.style.color = "white";
        output.style.borderColor = "black";
        output.setAttribute("class", "alert alert-secondary col");

        let outputHead = document.createElement("h4");
        outputHead.innerText = "See trailer below";
        output.appendChild(outputHead);

        resultTrailer.forEach(item => {
            let videoId = item.id.videoId;
            let videoTitle = item.snippet.title;

            // handle data and present it
            let linkToVid = document.createElement("iframe");
            linkToVid.setAttribute("width", "560");
            linkToVid.setAttribute("height", "315");
            linkToVid.setAttribute("src", `https://www.youtube.com/embed/${videoId}`);
            linkToVid.setAttribute("title", "YouTube video player");
            linkToVid.setAttribute("frameborder", "0");
            linkToVid.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
            linkToVid.setAttribute("allowfullscreen", "true");
            output.appendChild(linkToVid);

            let titleElement = document.createElement("p");
            titleElement.innerHTML = videoTitle;
            output.appendChild(titleElement);

            // call add history to add info and trailer to storage
            addHistory(movieDetails, resultTrailer);
        });
        trailerResDiv.appendChild(output);
    }
}

// function to add info and trailer to local storage
function addHistory(result, resultedTrailer) {
    let movieHistory = localStorage.getItem("local_history");
    movieHistory = movieHistory ? JSON.parse(movieHistory) : [];

    let additionalMovie = {};

    let name = document.querySelector(`#name`);
    let year = document.querySelector(`#year`);

    additionalMovie.name = name.value;
    additionalMovie.year = year.value;

    additionalMovie.details = result;
    additionalMovie.trailer = resultedTrailer;

    movieHistory.push(additionalMovie);
    localStorage.setItem("local_history", JSON.stringify(movieHistory));
}


// function to retrieve data about movie and trailer from local storage 
function loadMovie(nm, yr) {
    let movieHistory = localStorage.getItem("local_history");
    movieHistory = movieHistory ? JSON.parse(movieHistory) : [];
    
    for(let movie in movieHistory){
        if(movieHistory[movie].name == nm & movieHistory[movie].year == yr){
            return movieHistory[movie];
        }
        else{
            continue;
        }
    }
    return false;
}

// start of everything :)
async function clickedon() {
    let name = document.querySelector('#name').value;
    let year = document.querySelector('#year').value;
    let resultsDiv = document.querySelector('#movie_details');
    getDetails(name, year, resultsDiv);
    
}
