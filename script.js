/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoia3Nob2VzdGVyIiwiYSI6ImNsdG9jOXN3djBoMnYyaW1zYnRuZ3VkYzYifQ.Z976OphNTmOc_8gG7O6khQ';

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/kshoester/cltsd7k7400ct01qs61u02utn',  // Mapbox style created using Toronto census tracts
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});



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
    //document.getElementById('bboxbutton').addEventListener('click', () => {
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
    cellSide = 0.5; // length of side of hexagons; also the radius 
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


    // ADD TO MAP
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
            'circle-radius': 3,
            'circle-color': 'blue'
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
            'fill-opacity': 0.5,
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
            'fill-color': 'yellow',
            'fill-opacity': 0.5,
            'fill-outline-color': 'black'
        }
    });




 



});
 
    

//});