//---------------------------VAO---------------------------//
//create VAO
function setVAO(){
  _vao = gl.createVertexArray();
  bindVAO(_vao);
  return _vao;
}
//unbind VAO
function unbindVAO(){
  gl.bindVertexArray(null);
}
//bind VAO
function bindVAO(_name){
  gl.bindVertexArray(_name);
}
//---------------------------VAO---------------------------//

//---------------------------Buffers and Attributes---------------------------//
//Buffer
function SetBuffer(_data, _type) {
  var _Buffer = gl.createBuffer();
  if (_type === "index") {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _Buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(_data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, _Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  return _Buffer;
}

//Attribute
function SetAttribute(webglHelper, _name, _size, _stride, _offset) {

  var _AttributeLocation = gl.getAttribLocation(webglHelper.program, _name);
	gl.enableVertexAttribArray(_AttributeLocation);
	var size = _size;
	var type = gl.FLOAT;
	var normalize = false;
	var stride = _stride * Float32Array.BYTES_PER_ELEMENT;
	var offset = _offset * Float32Array.BYTES_PER_ELEMENT;
	gl.vertexAttribPointer(_AttributeLocation, size, type, normalize, stride, offset);

  if (webglHelper.attribLocations[_name] !== undefined)
        return webglHelper.attribLocations[_name];
  webglHelper.attribLocations[_name] = _AttributeLocation;
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return _AttributeLocation;
}

//Buffer and Attribute
function SetBufferAndAttribute(webglHelper, _name,_data, _size, _stride, _offset) {

  var _Buffer=SetBuffer(_data);
	gl.bindBuffer(gl.ARRAY_BUFFER, _Buffer);
	SetAttribute(webglHelper, _name, _size, _stride, _offset);
}

function SetIndexBuffer(_data) {
  var _Buffer=SetBuffer(_data,"index");
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _Buffer);
}

 // Get and cache a uniform location by name
function getUniformLocation(webglHelper,_name) {
    if (webglHelper.uniformLocations[_name] !== undefined)
      return webglHelper.uniformLocations[_name];

    var loc = gl.getUniformLocation(webglHelper.program, _name);
    webglHelper.uniformLocations[_name] = loc;
    return loc;
  }

  // Convenience: set a mat4 uniform
function setUniformMatrix4fv(webglHelper,_name, mat4Array, transpose = false) {
    gl.uniformMatrix4fv(getUniformLocation(webglHelper, _name), transpose, mat4Array);
  }

//---------------------------Buffers and Attributes---------------------------//


// Help the mouse line up to the board for tile selection
function rayFromMouse(mouseX, mouseY, aspect, fov, eye, target, up) {
    let forward = normalize(subtract(target, eye));
    let right = normalize(cross(forward, up));
    let trueUp = normalize(cross(right, forward));

    let tanFov = Math.tan(fov / 2);

    let px = mouseX * aspect * tanFov;
    let py = mouseY * tanFov;

    let dir = normalize([
        forward[0] + right[0] * px + trueUp[0] * py,
        forward[1] + right[1] * px + trueUp[1] * py,
        forward[2] + right[2] * px + trueUp[2] * py
    ]);

    return {
        origin: eye,
        direction: dir
    };
}

function intersectRayWithZPlane(rayOrigin, rayDir, planeZ) {
    if (Math.abs(rayDir[2]) < 0.000001) return null;

    let t = (planeZ - rayOrigin[2]) / rayDir[2];
    if (t < 0) return null;

    return [
        rayOrigin[0] + rayDir[0] * t,
        rayOrigin[1] + rayDir[1] * t,
        planeZ
    ];
}

//---------------------------Matricies---------------------------//

//View Matrix
function View(webglHelper, eye, target, up) {
    let zAxis = normalize(subtract(eye, target));
    let xAxis = normalize(cross(up, zAxis));
    let yAxis = cross(zAxis, xAxis);

    let viewMatrix = new Float32Array([
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1
    ]);

    setUniformMatrix4fv(webglHelper, 'uView', viewMatrix);
}
// helper functions for View
function subtract(a,b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }

function cross(a,b){
    return [
        a[1]*b[2]-a[2]*b[1],
        a[2]*b[0]-a[0]*b[2],
        a[0]*b[1]-a[1]*b[0]
    ];
}

function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }

function normalize(v){
    let len = Math.hypot(v[0],v[1],v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
}

//Projection Matrix
function Projection(webglHelper, fov, aspect, near, far) {
    let f = 1.0 / Math.tan(fov / 2);
    let rangeInv = 1 / (near - far);

    let projMatrix = new Float32Array([
        f/aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ]);

    setUniformMatrix4fv(webglHelper, 'uProjection', projMatrix);
}

//Scale Matrix
function Scale(webglHelper, Sx, Sy, Sz) {
	var ScaleMatrix = new Float32Array([
		Sx, 0.0, 0.0, 0.0,
		0.0, Sy, 0.0, 0.0,
		0.0, 0.0, Sz, 0.0,
		0.0, 0.0, 0.0,1.0
	]);
	setUniformMatrix4fv(webglHelper,'uScale', ScaleMatrix);

	return ScaleMatrix;
}

//Translation
function Translate(webglHelper, Tx, Ty, Tz) {
	var TranslationMatrix = new Float32Array([
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		Tx,  Ty,  Tz,  1.0
	]);
	
  setUniformMatrix4fv(webglHelper,'uTranslate', TranslationMatrix);

	return TranslationMatrix;
}

function RotateY(webglHelper, angle){
    var c = Math.cos(angle);
    var s = Math.sin(angle);

    var RotationMatrix = new Float32Array([
        c, 0.0, -s, 0.0,
        0.0, 1.0, 0.0, 0.0,
        s, 0.0, c, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    setUniformMatrix4fv(webglHelper,'uRotateY', RotationMatrix);
    return RotationMatrix;
}

function RotateX(webglHelper, angle){
    var c = Math.cos(angle);
    var s = Math.sin(angle);

    var RotationMatrix = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, c, s, 0.0,
        0.0, -s, c, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    setUniformMatrix4fv(webglHelper,'uRotateX', RotationMatrix);
    return RotationMatrix;
}

function RotateZ(webglHelper, angle){
    var c = Math.cos(angle);
    var s = Math.sin(angle);

    var RotationMatrix = new Float32Array([
        c, s, 0.0, 0.0,
        -s, c, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    setUniformMatrix4fv(webglHelper,'uRotateZ', RotationMatrix);
    return RotationMatrix;
}

//---------------------------Matricies---------------------------//

// Creates one tile with a black outline
function createTile(x, y, tileSize, row, col) {
    const half = tileSize / 2;

    const fillVertices = [
        x-half, y-half, -0.10,
        x+half, y-half, -0.10,
        x+half, y+half, -0.10,

        x-half, y-half, -0.10,
        x+half, y+half, -0.10,
        x-half, y+half, -0.10
    ];

    const fillColors = Array(6).fill().flatMap(() => [0.10, 0.50, 0.90]);
    const fillIndices = [0,1,2,3,4,5];
    const fillShape = new Shape(fillVertices, fillColors, fillIndices);

    const outlineVertices = [
        x-half, y-half, -0.09,
        x+half, y-half, -0.09,
        x+half, y+half, -0.09,
        x-half, y+half, -0.09,
        x-half, y-half, -0.09
    ];

    const outlineColors = Array(5).fill().flatMap(() => [0.0, 0.0, 0.0]);
    const outlineIndices = [0,1,2,3,4];
    const outlineShape = new Shape(outlineVertices, outlineColors, outlineIndices, gl.LINE_STRIP);

    return {
        row,
        col,
        center: [x, y],
        size: tileSize,
        color: [0.10, 0.50, 0.90],
        fill: fillShape,
        outline: outlineShape,
        isShip: false
    };
}

// Creates a grid of tiles
// Bottom row is row 0, left column is col 0
function createTileGrid(xOffset, yOffset, tileSize, gap, divisions) {
    const tiles = [];
    const step = tileSize + gap;

    const totalWidth = divisions * tileSize + (divisions - 1) * gap;

    const startX = -totalWidth / 2 + tileSize / 2 + xOffset;
    const startY = -totalWidth / 2 + tileSize / 2 + yOffset;

    for (let row = 0; row < divisions; row++) {
        for (let col = 0; col < divisions; col++) {
            const x = startX + col * step;
            const y = startY + row * step;
            tiles.push(createTile(x, y, tileSize, row, col));
        }
    }

    return tiles;
}


function getHoveredTile(mouseX, mouseY, tiles) {
    for (let tile of tiles) {
        const half = tile.size / 2;

        const left = tile.center[0] - half;
        const right = tile.center[0] + half;
        const bottom = tile.center[1] - half;
        const top = tile.center[1] + half;

        if (
            mouseX >= left &&
            mouseX <= right &&
            mouseY >= bottom &&
            mouseY <= top
        ) {
            return tile;
        }
    }

    return null;
}

// Helper to find a tile by its row and column
function getTileAtRowCol(tiles, row, col) {
    return tiles.find(tile => tile.row === row && tile.col === col) || null;
}

// Gets the cells that a ship would occupy based on its starting tile, length, and orientation
function getPlacementCells(startTile, shipLength, horizontal, tiles) {
    const cells = [];

    for (let i = 0; i < shipLength; i++) {
        const row = horizontal ? startTile.row : startTile.row + i;
        const col = horizontal ? startTile.col + i : startTile.col;

        const tile = getTileAtRowCol(tiles, row, col);
        if (!tile) return null;

        cells.push(tile);
    }

    return cells;
}

// Makes sure the cells a ship would occupy are not already occupied by another placed ship
function cellsOverlapPlacedShip(cells, fleet) {
    for (let ship of fleet) {
        if (!ship.placed) continue;

        for (let cell of cells) {
            for (let placedCell of ship.cells) {
                if (cell.row === placedCell.row && cell.col === placedCell.col) {
                    return true;
                }
            }
        }
    }
    return false;
}
// Checks if a point is inside a rectangle (used for picking ships on the side)
function pointInRect(x, y, cx, cy, w, h) {
    return (
        x >= cx - w / 2 &&
        x <= cx + w / 2 &&
        y >= cy - h / 2 &&
        y <= cy + h / 2
    );
}

// Returns a unique string key for a tile based on its row and column
function getTileKey(tile) {
    return tile.row + "," + tile.col;
}

// Checks if a tile is part of any ship in the fleet. Returns the ship if found, else null.
function checkHit(tile, fleet) {
    for (let ship of fleet) {
        for (let cell of ship.cells) {
            if (cell.row === tile.row && cell.col === tile.col) {
                return ship;
            }
        }
    }
    return null;
}

// Returns true if every cell of a ship has been hit
function isShipSunk(ship, hitSet) {
    for (let cell of ship.cells) {
        if (!hitSet.has(getTileKey(cell))) {
            return false;
        }
    }
    return true;
}

// Returns true if every ship in the fleet is sunk
function isFleetSunk(fleet, hitSet) {
    for (let ship of fleet) {
        if (!isShipSunk(ship, hitSet)) {
            return false;
        }
    }
    return true;
}