function computeGrid(width, height, n) {
  const minSide = Math.min(width, height);
  const tileSize = Math.floor(minSide / n);
  let cols;
  let rows;

  if (width < height) {
    cols = n;
    rows = Math.floor(height / tileSize);
  } else if (height < width) {
    rows = n;
    cols = Math.floor(width / tileSize);
  } else {
    cols = n;
    rows = n;
  }

  return {
    cols: cols,
    rows: rows,
    tileSize: tileSize,
    usedW: cols * tileSize,
    usedH: rows * tileSize,
    width: width,
    height: height,
  };
}

function tileBackgroundStyle(x, y, grid, url) {
  const offsetX = (grid.width - grid.usedW) / 2;
  const offsetY = (grid.height - grid.usedH) / 2;
  const sizeX = (grid.width / grid.tileSize) * 100;
  const sizeY = (grid.height / grid.tileSize) * 100;
  const posX = grid.width === grid.tileSize || grid.cols === 1
    ? 0
    : ((offsetX + x * grid.tileSize) / (grid.width - grid.tileSize)) * 100;
  const posY = grid.height === grid.tileSize || grid.rows === 1
    ? 0
    : ((offsetY + y * grid.tileSize) / (grid.height - grid.tileSize)) * 100;

  return {
    backgroundImage: 'url("' + url + '")',
    backgroundSize: sizeX + '% ' + sizeY + '%',
    backgroundPosition: posX + '% ' + posY + '%',
    backgroundRepeat: 'no-repeat',
  };
}

function croppedImageStyle(grid, url) {
  return {
    backgroundImage: 'url("' + url + '")',
    backgroundSize: (grid.width / grid.usedW) * 100 + '% ' + (grid.height / grid.usedH) * 100 + '%',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

function createTiles(grid, url) {
  const tiles = [];
  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.cols; x += 1) {
      tiles.push({
        id: y * grid.cols + x,
        x: x,
        y: y,
        style: tileBackgroundStyle(x, y, grid, url),
      });
    }
  }
  return tiles;
}

function isSolved(tiles, cols) {
  return tiles.every(function (tile, index) {
    return tile.x === index % cols && tile.y === Math.floor(index / cols);
  });
}

function shuffleTiles(tiles, cols) {
  const result = tiles.slice();
  const count = result.length;

  for (let i = 0; i < count; i += 1) {
    const a = Math.floor(Math.random() * count);
    let b = Math.floor(Math.random() * count);
    if (b === a) {
      b = (b + 1) % count;
    }
    const swap = result[a];
    result[a] = result[b];
    result[b] = swap;
  }

  if (isSolved(result, cols) && count > 1) {
    const swap = result[0];
    result[0] = result[1];
    result[1] = swap;
  }

  return result;
}
