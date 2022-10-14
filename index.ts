import axios from 'axios'
import chalk from 'chalk'

const TILES_PER_ROW = 5
const BOTTOM_ROW_START_INDEX = 20

interface FigureData {
  id: number
  moves: number
  tiles: number[]
  go_live: string
  hint: number
  solution: number[]
}

async function getFigureData(): Promise<FigureData> {
  const websiteData = await axios.get('https://figure.game');
  const data = websiteData.data.match(/"puzzleData":(.*?)},"__N/)
  console.log('data', data[1])
  let figureData
  try {
    figureData = JSON.parse(data[1])
  } catch(error) {
    console.error('could not parse figure data', error)
    process.exit(1)
  }

  return figureData;
}

function reorderTilesAfterRemoving(tiles: number[]): number[] {
  let change = true
  while(change) {
    change = false
    for(let i = tiles.length; i > 0; i--) {
      const pos = i-1;
      if(tiles[pos] !== 5) continue

      if(pos - 5 < 0) {
        tiles[pos] = 9
      } else {
        tiles[pos] = tiles[pos - 5]
        tiles[pos - 5] = 5
      }
      change = true
    }
  }
  return tiles
}

//position can only be in the bottom row
function deleteTileAtPositionAndRemoveConnectingTiles(tiles: number[], position: number): number[] {
  const tileColorToDelete = tiles[BOTTOM_ROW_START_INDEX + position]
  tiles[BOTTOM_ROW_START_INDEX + position] = 5
  let change = true
  while(change) {
    change = false
    for(let i = tiles.length; i > 0; i--) {
      let min = 0;
      let max = 0;
      const pos = i-1

      if(pos > 19) {min = 20; max = 24}
      else if(pos > 14) {min = 15; max = 19}
      else if(pos > 10) {min = 10; max = 14}
      else if(pos > 5) {min = 5; max = 9}
      else {min = 0; max = 4}


      if(tiles[pos] !== tileColorToDelete) continue

      if(pos+1 < tiles.length && pos+1 <= max && tiles[pos+1] === 5) {
        tiles[pos] = 5
        change = true
      } else if(pos-1 > 0 && pos-1 >= min && tiles[pos-1] === 5) {
        tiles[pos] = 5
        change = true
      } else if(pos + TILES_PER_ROW < tiles.length && tiles[pos + TILES_PER_ROW] === 5) {
        tiles[pos] = 5
        change = true
      }
    }
  }
  return reorderTilesAfterRemoving(tiles)
}




function printTiles(label: string, tiles: number[]) {
  const arrayToPrint = [...tiles]
  console.clear()
  console.log(label.toUpperCase())
  for(let i = 0; i < 5; i++) {
    let line = ""
    for(let j = 0; j < 5; j++) {
      const number = arrayToPrint.shift()
      switch(number) {
        case 0:
          line += chalk.cyan('X') + " "
          break
        case 1:
          line += chalk.magenta('X') + " "
          break
        case 2:
          line += chalk.yellow('X') + " "
          break
        case 3:
          line += chalk.white('X') + " "
          break
        default:
          line += chalk.black(' ') + " "
      }
    }
    console.log(line)
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  // getFigureData().then(data => console.log('figureData', data))
  const figureData = JSON.parse('{"id":109,"moves":10,"tiles":[1,2,1,1,3,1,0,1,0,2,0,1,0,3,3,3,3,0,2,1,2,2,3,1,3],"go_live":"2022-10-14T08:00:50.872703+00:00","hint":4,"solution":[4,3,4,0,3,0,0,2,0,1]}') as FigureData


  let tiles
  let found = false
  let steps
  let tries = 0
  while(!found) {
    tiles = [...figureData.tiles]
    steps = []
    tries += 1
    printTiles('START Figure', tiles)
    while(tiles.some(value => value !== 9)) {
      let random = getRandomInt(5)
      while(tiles[BOTTOM_ROW_START_INDEX + random] === 9) {
        random = getRandomInt(5)
      }
      steps.push(random)
      tiles = deleteTileAtPositionAndRemoveConnectingTiles(tiles, random)
      printTiles(`Try ${tries} -- Move ${steps.length}`, tiles)
      await delay(5)
    }
    if(steps.length <= figureData.moves) found = true
    console.log('Steps', steps, steps.length)
  }

}

main().then()
