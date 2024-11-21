"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

var torsoColor = vec4(1.0, 0.0, 0.0, 1.0);  // Red
var mainShaftColor = vec4(0.0, 1.0, 0.0, 1.0); // Green
var fanShaftColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue
var fanColor = vec4(1.0, 1.0, 0.0, 1.0);   // Yellow

var uColor; // Vertex color attribute location
var fanSpeed = 0.5;

var torsoId = 0;
var mainShaftId = 1;
var fanShaft1Id = 2;
var fan1Id = 3;
var fanShaft2Id = 4;
var fan2Id = 5;
var fanShaft3Id = 6;
var fan3Id = 7;
var fanShaft4Id = 8;
var fan4Id = 9;

var torsoHeight = 5.0;
var torsoWidth = 1.0;
var mainShaftHeight = 5.0;
var mainShaftWidth = 0.5;
var fanShaftHeight = 6.0;
var fanShaftWidth  = 0.5;
var fanHeight = 6.0;
var fanWidth  = 2.0;

var numSides = 16;
var numNodes = 10;
var numAngles = 11;
var angle = 0;

var theta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var numVertices = 24;

var stack = [];

var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

init();

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0] = a;
   result[5] = b;
   result[10] = c;
   return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}


function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case torsoId:

    m = rotate(theta[torsoId], vec3(0, 1, 0) );
    figure[torsoId] = createNode( m, torso, null, mainShaftId );
    break;

    case mainShaftId:

    m = translate(0.0, 2.0, 0.0);
      m = mult(m, rotate( -90, vec3(1, 0, 0)));
	  m = mult(m, rotate(theta[mainShaftId], vec3(0, 1, 0)));
    figure[mainShaftId] = createNode( m, mainShaft, null, fanShaft1Id);
    break;

    case fanShaft1Id:

    m = translate(0.0, 5.0, 0.0);
      m = mult(m, rotate( -90, vec3(1, 0, 0)));
	  m = mult(m, rotate(theta[fanShaft1Id], vec3(0, 0, 1)));
    figure[fanShaft1Id] = createNode( m, fanShaft, fanShaft2Id, fan1Id );
    break;

    case fanShaft2Id:

    m = translate(0.0, 5.0, 0.0);
      m = mult(m, rotate( -90, vec3(0, 0, 1)));
      m = mult(m, rotate( 90, vec3(0, 1, 0)));
	  m = mult(m, rotate(theta[fanShaft2Id], vec3(0, 0, 1)));
    figure[fanShaft2Id] = createNode( m, fanShaft, fanShaft3Id, fan2Id );
    break;

    case fanShaft3Id:

    m = translate(0.0, 5.0, 0.0);
      m = mult(m, rotate( 90, vec3(1, 0, 0)));
	  m = mult(m , rotate(theta[fanShaft3Id], vec3(0, 0, 1)));
    figure[fanShaft3Id] = createNode( m, fanShaft, fanShaft4Id, fan3Id );
    break;

    case fanShaft4Id:

    m = translate(0.0, 5.0, 0.0);
      m = mult(m, rotate( 90, vec3(0, 0, 1)));
      m = mult(m, rotate( 90, vec3(0, 1, 0)));
	  m = mult(m, rotate(theta[fanShaft4Id], vec3(0, 0, 1)));
    figure[fanShaft4Id] = createNode( m, fanShaft, null, fan4Id );
    break;

    case fan1Id:

    m = translate(0.0, 0.0, 0.0);
    m = mult(m, rotate(theta[fan1Id], vec3(0, 1, 0)));
    figure[fan1Id] = createNode( m, fan, null, null );
    break;

    case fan2Id:

    m = translate(0.0, 0.0, 0.0);
    m = mult(m, rotate(theta[fan2Id], vec3(0, 1, 0)));
    figure[fan2Id] = createNode( m, fan, null, null );
    break;

    case fan3Id:

    m = translate(0.0, 0.0, 0.0);
    m = mult(m, rotate(theta[fan3Id],vec3(0, 1, 0)));
    figure[fan3Id] = createNode( m, fan, null, null );
    break;

    case fan4Id:

    m = translate(0.0, 0.0, 0.0);
    m = mult(m, rotate(theta[fan4Id], vec3(0, 1, 0)));
    figure[fan4Id] = createNode( m, fan, null, null );
    break;

    }

}

function traverse(Id) {

   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale( torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    gl.uniform4fv(gl.getUniformLocation(program, "uColor"), flatten(torsoColor));
    // for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    cylinder();
}

function mainShaft() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * mainShaftHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale(mainShaftWidth, mainShaftHeight, mainShaftWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    gl.uniform4fv(gl.getUniformLocation(program, "uColor"), flatten(mainShaftColor));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function fanShaft() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * fanShaftHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(fanShaftWidth, fanShaftHeight, fanShaftWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    gl.uniform4fv(gl.getUniformLocation(program, "uColor"), flatten(fanShaftColor));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function fan() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * fanHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(fanWidth, fanHeight, 0.2) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    gl.uniform4fv(gl.getUniformLocation(program, "uColor"), flatten(fanColor));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     pointsArray.push(vertices[b]);
     pointsArray.push(vertices[c]);
     pointsArray.push(vertices[d]);
}


function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function cylinder() {
    var angleIncrement = 360 / numSides;

    // Draw the top circle
    for (var i = 0; i < numSides; i++) {
        var angle1 = i * angleIncrement;
        var angle2 = (i + 1) * angleIncrement;
        var x1 = 2 * Math.cos(radians(angle1));
        var y1 = 2; // Top of the cylinder
        var z1 = 0.5 * Math.sin(radians(angle1));
        var x2 = 2 * Math.cos(radians(angle2));
        var y2 = 2; // Top of the cylinder
        var z2 = 0.5 * Math.sin(radians(angle2));

        pointsArray.push(vec4(0.0, y1, 0.0, 1.0)); // Center of the circle
        pointsArray.push(vec4(x1, y1, z1, 1.0));
        pointsArray.push(vec4(x2, y2, z2, 1.0));

        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, pointsArray.length - 3, 3);


    }

    // Draw the bottom circle
    for (var i = 0; i < numSides; i++) {
        var angle1 = i * angleIncrement;
        var angle2 = (i + 1) * angleIncrement;
        var x1 = 4 * Math.cos(radians(angle1));
        var y1 = -2.5; // Bottom of the cylinder
        var z1 = 4 * Math.sin(radians(angle1));
        var x2 = 4 * Math.cos(radians(angle2));
        var y2 = -2.5; // Bottom of the cylinder
        var z2 = 4 * Math.sin(radians(angle2));

        pointsArray.push(vec4(0.0, y1, 0.0, 1.0)); // Center of the circle
        pointsArray.push(vec4(x1, y1, z1, 1.0));
        pointsArray.push(vec4(x2, y2, z2, 1.0));

        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, pointsArray.length - 3, 3);


    }

    // Draw the sides
    for (var i = 0; i < numSides; i++) {
        var angle1 = i * angleIncrement;
        var angle2 = (i + 1) * angleIncrement;
        var x1top = 2 * Math.cos(radians(angle1));     // Top circle x
        var z1top = 2 * Math.sin(radians(angle1));     // Top circle z
        var x2top = 2 * Math.cos(radians(angle2));     // Top circle x
        var z2top = 2 * Math.sin(radians(angle2));     // Top circle z

        var x1bottom = 4 * Math.cos(radians(angle1)); // Bottom circle x
        var z1bottom = 4 * Math.sin(radians(angle1)); // Bottom circle z
        var x2bottom = 4 * Math.cos(radians(angle2)); // Bottom circle x
        var z2bottom = 4 * Math.sin(radians(angle2)); // Bottom circle z


        pointsArray.push(vec4(x1top, 0.5, z1top, 1.0));        // Top vertex
        pointsArray.push(vec4(x1bottom, -2.5, z1bottom, 1.0)); // Bottom vertex

        pointsArray.push(vec4(x2top, 0.5, z2top, 1.0)); // Top vertex
        pointsArray.push(vec4(x2bottom, -2.5, z2bottom, 1.0)); // Bottom vertex

        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLE_STRIP, pointsArray.length - 4, 4);
    }


}

function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -10.0, 10.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    cube();

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    document.getElementById("slider0").onchange = function(event) {
        theta[torsoId] = event.target.value;
        initNodes(torsoId);
    };
    document.getElementById("slider1").onchange = function(event) {
        theta[mainShaftId] = event.target.value;
        initNodes(mainShaftId);
    };
    document.getElementById("slider2").onchange = function(event) {
        theta[fanShaft1Id] = event.target.value;
        initNodes(fanShaft1Id);
    };
    document.getElementById("slider3").onchange = function(event) {
        theta[fan1Id] = event.target.value;
        initNodes(fan1Id);
    };
    document.getElementById("slider4").onchange = function(event) {
        theta[fanShaft2Id] = event.target.value;
        initNodes(fanShaft2Id);
    };
    document.getElementById("slider5").onchange = function(event) {
        theta[fan2Id] = event.target.value;
        initNodes(fan2Id);
    };
    document.getElementById("slider6").onchange = function(event) {
        theta[fanShaft3Id] = event.target.value;
        initNodes(fanShaft3Id);
    };
    document.getElementById("slider7").onchange = function(event) {
        theta[fan3Id] = event.target.value;
        initNodes(fan3Id);
    };
    document.getElementById("slider8").onchange = function(event) {
        theta[fanShaft4Id] = event.target.value;
        initNodes(fanShaft4Id);
    };
    document.getElementById("slider9").onchange = function(event) {
        theta[fan4Id] = event.target.value;
        initNodes(fan4Id);
    };

    // Add event listener for the speed slider
    document.getElementById("speed-slider").oninput = function(event) {
        fanSpeed = parseFloat(event.target.value);
    };

    // Add event listeners for the color pickers
    document.getElementById("torso-color").oninput = function(event) {
        torsoColor = hexToVec4(event.target.value);
    };
    document.getElementById("main-shaft-color").oninput = function(event) {
        mainShaftColor = hexToVec4(event.target.value);
    };
    document.getElementById("fan-shaft-color").oninput = function(event) {
        fanShaftColor = hexToVec4(event.target.value);
    };
    document.getElementById("fan-color").oninput = function(event) {
        fanColor = hexToVec4(event.target.value);
    };

    for (i = 0; i < numNodes; i++) initNodes(i);

    render();
}

// Helper function to convert hex color to vec4
function hexToVec4(hex) {
    var bigint = parseInt(hex.slice(1), 16);
    var r = ((bigint >> 16) & 255) / 255.0;
    var g = ((bigint >> 8) & 255) / 255.0;
    var b = (bigint & 255) / 255.0;
    return vec4(r, g, b, 1.0);
}


function render(timestamp) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta[mainShaftId] += fanSpeed;
    theta[mainShaftId] %= 360;
    initNodes(mainShaftId);
    traverse(torsoId);
    requestAnimationFrame(render);
}
