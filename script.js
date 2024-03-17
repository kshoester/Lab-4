/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoia3Nob2VzdGVyIiwiYSI6ImNsdG9jOXN3djBoMnYyaW1zYnRuZ3VkYzYifQ.Z976OphNTmOc_8gG7O6khQ';

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/kshoester/cltw51ko0011001qe4m155nvc',  // Mapbox style created using Toronto census tracts
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});

// Map controls
map.addControl(new mapboxgl.NavigationControl(), 'bottom-left'); // add zoom + rotation controls
map.addControl(new mapboxgl.FullscreenControl()); // add full screen control


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let pedcycgeojson; // create empty variable

fetch('https://kshoester.github.io/Lab-4/data/pedcyc_collision_06-21.geojson') // fetch geojson from url
    .then(response => response.json()) // store response
    .then(response => {
        console.log(response); // check response in console
        pedcycgeojson = response; // store geojson as a variable using url from fetch response
    });


/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function



/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


// /*--------------------------------------------------------------------
// MAP
// --------------------------------------------------------------------*/

map.on('load', () => {

    // create a bounding box
    let bboxgeojson; // create empty variable
    
        let bbox = turf.envelope(pedcycgeojson); // send point geojson to turf, creates an envelope (bounding box) around points; store as a feature collection variable 'bbox'
        
        bboxgeojson = {
            'type': 'FeatureCollection', // assign resulting bbox envelope to bboxgeojson variable as a geojson format FeatureCollection
            'features': [bbox] 
        };

    // access + store the bounding box coordinates as an array variable
    // access coordinates + explore variable output in console
    console.log(bbox)
    console.log(bbox.geometry.coordinates) 
    
    // min x: -79.621974
    // min y: 43.590289
    // max x: -79.122974
    // max y: 43.837935

    let minX = bbox.geometry.coordinates[0][0][0];
    let minY = bbox.geometry.coordinates[0][0][1];
    let maxX = bbox.geometry.coordinates[0][2][0];
    let maxY = bbox.geometry.coordinates[0][2][1];

    console.log('minX', minX);
    console.log('minY', minY);
    console.log('maxX', maxX);
    console.log('maxY', maxY);
    // yay they match
    
    // create new array variable to store them using the correct order (minX, minY, maxX, maxY)
    let bboxcoords = [bbox.geometry.coordinates[0][0][0], bbox.geometry.coordinates[0][0][1], bbox.geometry.coordinates[0][2][0], bbox.geometry.coordinates[0][2][1]];

    // set arguments for hexgrid function
    bbox = bboxcoords // instead of coordinates in [], use variable from earlier
    cellSide = 0.3; // length of side of hexagons (3 km); also the radius 
    options = {units: 'kilometers'} // optional parameters

   // use turf transformScale method to fix points at edge of bounding box that are not covered by hexagons; define this variable before using it below
    bboxpoly = turf.polygon([
        [
            [bboxcoords[0], bboxcoords[1]], // bottom left corner, [minX, minY]
            [bboxcoords[0], bboxcoords[3]], // top left corner, [minX, maxY]
            [bboxcoords[2], bboxcoords[3]], // top right corner, [maxX, maxY]
            [bboxcoords[2], bboxcoords[1]], // bottom right corner, [maxX, minY]
            [bboxcoords[0], bboxcoords[1]] // closing coordinate (same as first)
        ]
    ]);
    hexgridscaled = turf.transformScale(bboxpoly, 1.05,); // increase size by 5% (1 = 100%)

    // use turf.js hexGrid function to create grid of 0.5km hexagons inside the spatial limits of the bboxcoords feature
    hexgridresult = turf.hexGrid (turf.bbox(hexgridscaled), cellSide, options); // storing result of hexgrid function as variable; use turf.bbox to get extent coords of hexgridscaled 

    // use turf collect function to count all unique '_id' properties from the collision data that are inside each hexagon
    let collishex = turf.collect(hexgridresult, pedcycgeojson, '_id', 'values'); // use the DATA variable (data in addsource)

    console.log(collishex); // view in console; values array property will be empty if the hexagon does not contain any collision points

    // create forEach loop (iterates through hexagons) to add a point add (COUNT) + identify the max # of collisions in a polygon
    let maxcollis = 0; // initializes variable + sets initial value to 0; variable will be used to track max # of collisions in a polygon

    collishex.features.forEach((feature) => { // starts the forEach loop to iterate through each feature (hexagon) in collishex
        feature.properties.COUNT = feature.properties.values.length // calculates # of points (COUNT) within each hexagon + assigns it to the COUNT property of each hexagon
        if (feature.properties.COUNT > maxcollis) { // checks if # of collision points in current hexagon is greater than current max #
            maxcollis = feature.properties.COUNT // if the above is true, update maxcollis to the current hexagon count
        }
    });

    console.log(maxcollis); // view max # of collisions in a polygon in console


//------------ DATA VISUALIZATION ---------------//
    // collisions data
    map.addSource('pedcyc-collisions-data', { 
        'type': 'geojson',
        data: pedcycgeojson // collision data variable from earlier
    });
    map.addLayer({
        'id': 'pedcyc-collisions',
        'type': 'circle',
        'source': 'pedcyc-collisions-data',
        'paint': {
            'circle-radius': [ // change marker size based on zoom
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 2, // when zoom is 12 or less, 2px
                12.5, 2.5, // 12-13, 2.5px
                13, 4 // 13 or greater, 3px
            ],
            'circle-color': '#ce1256'
        },
    });

    // bounding box
    map.addSource('collis-bbox', { 
        type: 'geojson',
        data: bboxgeojson // the bounding box created above
    });
    map.addLayer({
        'id': 'collis-box',
        'type': 'fill',
        'source': 'collis-bbox',
        'paint': {
            'fill-color': 'red',
            'fill-opacity': 0, // opacity to 0 so that it won't display
            'fill-outline-color': 'black'
        }
    });

    // scaled hexgrid
    map.addSource('hexgrid-data', { 
        'type': 'geojson',
        'data': hexgridresult
    });
    map.addLayer({
        'id': 'hexgrid',
        'type': 'fill',
        'source': 'hexgrid-data',
        'paint': {
            'fill-color': [ // fill color based on COUNT attribute of each hexagon
                'step',
                ['get', 'COUNT'],
                '#edf8fb', // if COUNT is 0
                1, '#9ebcda', // if COUNT is 1-5
                5, '#8c96c6', // if COUNT is 5-10
                10, '#8c6bb1', // if COUNT is 10-40
                40, '#6e016b' // if COUNT is 40-69
            ],
            'fill-opacity': 0.4,
            'fill-outline-color': 'black'
        },
    },
        'pedcyc-collisions' // places hexgrid layer below points
    
    );

//------------ EVENTS ---------------//

// add pop-up on click event; show pop up of collision count when hexagon is clicked
map.on('click', 'hexgrid', (e) => { 
    new mapboxgl.Popup() // declare new popup object on each click
    .setLngLat(e.lngLat) // access long/lat based on mouse click location
    .setHTML('<b>Number of Collisions: </b>' + e.features[0].properties.COUNT) // use click event properties to write popup text
    .addTo(map);
});

// add pop-up on click event; show pop up of injury type when collision point is clicked
map.on('mouseenter', 'pedcyc-collisions', () => {
    map.getCanvas().style.cursor = 'pointer'; // change cursor to pointer when mouse is hovering collision point
});
map.on('mouseleave', 'pedcyc-collisions', () => { // change pointer to cursor when mouse is NOT hovering collision point
    map.getCanvas().style.cursor = '';
});


map.on('click', 'pedcyc-collisions', (e) => { 
    new mapboxgl.Popup() // declare new popup object on each click
    .setLngLat(e.lngLat) // access long/lat based on mouse click location
    .setHTML('<b>Injury type: </b>' + e.features[0].properties.INJURY) // use click event properties to write popup text
    .addTo(map);
});

});
 
// change map layer display based on check box using setLayoutProperty
let layercheck = document.getElementById('layercheck');

document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'pedcyc-collisions',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

// change display of legend based on check box
let legendcheck = document.getElementById('legendcheck');

legendcheck.addEventListener('click', () => {
    if (legendcheck.checked) {
        legendcheck.checked = true;
        legend.style.display = 'block';
    }
    else {
        legend.style.display = "none";
        legendcheck.checked = false;
    }
});

// filter pedcyc-collisions layer to show selected involved party type from dropdown selection
let collisinvtype;

document.getElementById("invpartyfieldset").addEventListener('change',(e) => {   
    collisinvtype = document.getElementById('INVTYPE').value;

    console.log(INVTYPE); // Useful for testing whether correct values are returned from dropdown selection

    if (collisinvtype == 'All') {
        map.setFilter(
            'pedcyc-collisions',
            ['has', '_id'] // Returns all polygons from layer that have a value in _id field
        );
    } else {
        map.setFilter(
            'pedcyc-collisions',
            ['==', ['get', 'INVTYPE'], collisinvtype] // returns polygon with collisinvtype value that matches dropdown selection
        );
    }

});

//------------ LEGEND ---------------//
//Declare array variables for labels and colours
const legendlabels = [
    '0 - 1',
    '2 - 5',
    '6 - 10',
    '10 - 40',
    '40 - 69'
];

const legendcolours = [
    '#edf8fb',
    '#9ebcda',
    '#8c96c6',
    '#8c6bb1',
    '#6e016b'
];

//Declare legend variable using legend div tag
const legend = document.getElementById('legend');

//For each layer create a block to put the colour and label in
legendlabels.forEach((label, i) => {
    const colour = legendcolours[i];

    const item = document.createElement('div'); //each layer gets a 'row' - this isn't in the legend yet, we do this later
    const key = document.createElement('span'); //add a 'key' to the row. A key will be the colour circle

    key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
    key.style.backgroundColor = colour; // the background color is retreived from teh layers array

    const value = document.createElement('span'); //add a value variable to the 'row' in the legend
    value.innerHTML = `${label}`; //give the value variable text based on the label

    item.appendChild(key); //add the key (colour cirlce) to the legend row
    item.appendChild(value); //add the value to the legend row

    legend.appendChild(item); //add row to the legend
});
