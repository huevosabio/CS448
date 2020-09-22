function plotMap(data, mapid) {

	// initialize map
	var leafletMap = L.map(mapid).setView([40.7831, -73.9712], 13);
        L.tileLayer("http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png")
        .addTo(leafletMap);

    // initialize canvas layer
    var glLayer = L.canvasOverlay()
                       .drawing(drawingOnCanvas)
                       .addTo(leafletMap);
    var canvas = glLayer.canvas();

    glLayer.canvas.width = canvas.clientWidth;
    glLayer.canvas.height = canvas.clientHeight;


    var gl = canvas.getContext('experimental-webgl', { antialias: true });

    var pixelsToWebGLMatrix = new Float32Array(16);
    var mapMatrix = new Float32Array(16);

    // -- WebGl setup - TODO: understand what each of these does
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, document.getElementById('vshader').text);
    gl.compileShader(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
    gl.compileShader(fragmentShader);

    // link shaders to create our program
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    var u_matLoc = gl.getUniformLocation(program, "u_matrix");
    var colorLoc = gl.getAttribLocation(program, "a_color");
    var vertLoc = gl.getAttribLocation(program, "a_vertex");
    gl.aPointSize = gl.getAttribLocation(program, "a_pointSize");
    // Set the matrix to some that makes 1 unit 1 pixel.

    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniformMatrix4fv(u_matLoc, false, pixelsToWebGLMatrix);


    // -- data
    var verts = [];
    var numPoints,
        vertBuffer,
        vertArray,
        fsize;

    data = d.loc;

    data.map(function (row, e) {
    	var state = [];
     	for (var i = 0; (i + 3) < row.length; i += 3) {
     		pixel = LatLongToPixelXY(row[i], row[i+1]);
     		//-- 2 coord, 3 rgb colors depend on status
     		switch (row[i+2]){
     			case 0:
     				rgb = [34, 139, 34];
        	        break;
        	    case 1:
        	        rgb = [0, 0, 128];
        	        break;
        	    case 2:
        	        rgb = [128, 0, 0];
        	        break;
        	}
        	state.push(pixel.x, pixel.y, rgb[0], rgb[1], rgb[2]);
        }
    	verts.push(state);    
    });

    //drawScene(verts[0]);

    numPoints = verts[0].length / 5;

    vertBuffer = gl.createBuffer();
    vertArray = new Float32Array(verts[0]);
    fsize = vertArray.BYTES_PER_ELEMENT;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(vertLoc, 2, gl.FLOAT, false,fsize*5,0);
    gl.enableVertexAttribArray(vertLoc);
    // -- offset for color buffer
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, fsize*5, fsize*2);
    gl.enableVertexAttribArray(colorLoc);
    glLayer.redraw();
    drawScene(verts[0]);

    return drawByIndex;

    function drawByIndex(ind){
    	drawScene(verts[ind]);
    }
    function drawScene(vertices){
    	gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
    	glLayer.redraw();
    }


    function drawingOnCanvas(canvasOverlay, params) {
        if (gl == null) return;

        gl.clear(gl.COLOR_BUFFER_BIT);


        pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
        gl.viewport(0, 0, canvas.width, canvas.height);



        var pointSize = Math.max(leafletMap.getZoom() - 4.0, 1.0);
        gl.vertexAttrib1f(gl.aPointSize, pointSize);

        // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
        mapMatrix.set(pixelsToWebGLMatrix);

        var bounds = leafletMap.getBounds();
        var topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
        var offset = LatLongToPixelXY(topLeft.lat, topLeft.lng);

        // -- Scale to current zoom
        var scale = Math.pow(2, leafletMap.getZoom());
        scaleMatrix(mapMatrix, scale, scale);

        translateMatrix(mapMatrix, -offset.x, -offset.y);

        // -- attach matrix value to 'mapMatrix' uniform in shader
        gl.uniformMatrix4fv(u_matLoc, false, mapMatrix);
        gl.drawArrays(gl.POINTS, 0, numPoints);

    }
    // -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
    // -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html

    function LatLongToPixelXY(latitude, longitude) {
        var pi_180 = Math.PI / 180.0;
        var pi_4 = Math.PI * 4;
        var sinLatitude = Math.sin(latitude * pi_180);
        var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256;
        var pixelX = ((longitude + 180) / 360) * 256;

        var pixel = { x: pixelX, y: pixelY };

        return pixel;
    }

    function translateMatrix(matrix, tx, ty) {
    	// translation is in last column of matrix
        matrix[12] += matrix[0] * tx + matrix[4] * ty;
        matrix[13] += matrix[1] * tx + matrix[5] * ty;
        matrix[14] += matrix[2] * tx + matrix[6] * ty;
        matrix[15] += matrix[3] * tx + matrix[7] * ty;
    }

    function scaleMatrix(matrix, scaleX, scaleY) {
    	// scaling x and y, which is just scaling first two columns of matrix
        matrix[0] *= scaleX;
        matrix[1] *= scaleX;
        matrix[2] *= scaleX;
        matrix[3] *= scaleX;

        matrix[4] *= scaleY;
        matrix[5] *= scaleY;
        matrix[6] *= scaleY;
        matrix[7] *= scaleY;
    }
}