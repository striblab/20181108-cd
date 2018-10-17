/**
 * Main JS file for project.
 */

// Define globals that are added through the js.globals in
// the config.json file, here like this:
// /* global _ */

// Utility functions, such as Pym integration, number formatting,
// and device checking

//import utilsFn from './utils.js';
//utilsFn({ });


// Import local ES6 modules like this:
//import utilsFn from './utils.js';

// Or import libraries installed with npm like this:
// import module from 'module';

// Utilize templates on the client.  Get the main content template.
//import Content from '../templates/_index-content.svelte.html';
//
// Get the data parts that are needed.  For larger data points,
// utilize window.fetch.  Add the build = true option in the buildData
// options.
//import content from '../content.json';
// OR: let content = await (await window.fetch('./assets/data/content.json')).json();
//
// const app = new Content({
//   target: document.querySelector('.main-app-container'),
//   data: {
//     content
//   }
// });

import Map from './map.js';
// import cd1 from './data/1.json';
// import cd2 from './data/2.json';
// import cd3 from './data/3.json';
// import cd8 from './data/8.json';

const map1 = new Map("#map1");
const map2 = new Map("#map2");
const map3 = new Map("#map3");
const map8 = new Map("#map8");


var race = "8";
var data;

function loadData(data) {
    map1.render("CD1", "mn", "GOP", "all", "1", data);
    map2.render("CD2", "mn", "GOP", "all", "2", data);
    map3.render("CD3", "mn", "GOP", "all", "3", data);
    map8.render("CD8", "mn", "GOP", "all", "8", data);
}

$.ajax({
    url: './data/' + race + '.json',
    async: false,
    dataType: 'json',
    success: function(response) {
        data = response.results;
        loadData(data);
    }
});