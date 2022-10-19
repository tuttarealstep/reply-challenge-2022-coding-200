import * as fs from 'fs'

interface ICoords {
    x: number,
    y: number,
    direction?: string
}

interface ITile {
    coords: ICoords,
    value: string,
    isVisited?: boolean
}

interface IPaths {
    path: string,
    portalUsed: number
}

interface IStats {
    foundPaths: Array<IPaths>,
    minSteps: number,
    maxPortals: number
}


/*

-------- X -------->
|
|
Y
|
|
\/

*/

interface IMap extends Array<Array<ITile>> { }

function copyObj(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

function readMap(filePath: string): IMap {
    const map: IMap = [];
    const mapCode: string = fs.readFileSync(filePath).toString()

    let x: number = 0;
    let y: number = 0;

    mapCode.split("\r\n").forEach((row: string) => {
        x = 0;

        row.split("").forEach((tile: string) => {
            if (map[x] == null)
                map[x] = []

            map[x][y] = {
                coords: { x, y },
                value: tile,
                isVisited: false
            } as ITile;
            x++;
        })

        y++;
    })

    return map
}

function printMap(map: IMap, currentTile: ITile | null = null) {
    let mapCode: string = "";

    for (let y in map) {
        for (let x in map) {
            if (currentTile && currentTile.coords.x == map[x][y].coords.x && currentTile.coords.y == map[x][y].coords.y)
                mapCode += "@"
            else
                mapCode += map[x][y].value
        }

        mapCode += "\r\n";
    }

    return mapCode
}

function findStartEndPoint(map: IMap): [ITile, ITile] {
    const startPoint: ITile = {
        coords: { x: -1, y: -1 },
        value: 'A'
    };
    const endPoint: ITile = {
        coords: { x: -1, y: -1 },
        value: 'B'
    };

    for (let y in map) {
        for (let x in map) {
            if (map[x][y].value == "A") {
                startPoint.coords = map[x][y].coords
            } else if (map[x][y].value == "B") {
                endPoint.coords = map[x][y].coords
            }
        }
    }

    return [startPoint, endPoint]
}

function findPortalPair(map: IMap, portal: string): [ITile, ITile] {
    const firstPoint: ITile = {
        coords: { x: -1, y: -1 },
        value: portal
    };
    const secondPoint: ITile = {
        coords: { x: -1, y: -1 },
        value: portal
    };

    for (let y in map) {
        for (let x in map) {
            if (map[x][y].value == portal && firstPoint.coords.x == -1 && firstPoint.coords.y == -1) {
                firstPoint.coords = map[x][y].coords
            } else if (map[x][y].value == portal && firstPoint.coords != map[x][y].coords) {
                secondPoint.coords = map[x][y].coords
            }
        }
    }

    return [firstPoint, secondPoint]
}

function isInMap(map: IMap, coord: ICoords) {
    return coord.x < map.length && coord.x >= 0 && coord.y < map[0].length && coord.y >= 0
}

function isBlackHole(tile: string) {
    return tile == "&"
}

function isNormalTile(tile: string) {
    return tile == "."
}

function isPortal(tile: string) {
    return !isBlackHole(tile) && !isNormalTile(tile) && tile != "A" && tile != "B"
}

function findTiles(map: IMap, coords: Array<ICoords>): Array<ITile> {
    const tiles: Array<ITile> = []

    coords.forEach(coord => {
        if (isInMap(map, coord)) {
            let tile = map[coord.x][coord.y]
            tiles.push(tile)
        }
    });

    return tiles
}

function nearBlackHolesCount(tiles: Array<ITile>): number {
    return tiles.filter((tile: ITile) => tile.value == "&").length
}

function getNearTiles(map: IMap, x: number, y: number) {
    const nearCells = [
        { x: x - 1, y: y - 1 }, //NO - 1
        { x: x, y: y - 1 }, //N - 2
        { x: x + 1, y: y - 1 }, //NE - 3
        { x: x - 1, y: y }, //O - 4
        { x: x + 1, y: y }, //E - 5
        { x: x - 1, y: y + 1 }, //SO - 6
        { x: x, y: y + 1 }, //S - 7
        { x: x + 1, y: y + 1 }, //SE -8
    ] as Array<ICoords>

    const nearTiles = findTiles(map, nearCells)

    return nearTiles
}

/**
 * step 0 = check if blackhole live
 * step 1 = check portals if they becomes blackhole
 * 
 * @param map 
 * @param step 
 * @returns 
 */
function computeMap(map: IMap): IMap {

    const newMap: IMap = copyObj(map);
    //Aggiorno buchi neri, tiles e portali

    //Un buco nero resiste solo se circondato da 2 o 3 buchi neri
    //Una tile normale o portale diventano buchi neri se circondati da più di 3 o più buchi neri 
    for (let yIndex in newMap) {
        for (let xIndex in newMap) {
            const x: number = parseInt(xIndex)
            const y: number = parseInt(yIndex)

            /**
              123
              4@5
              678
              */
            const nearTiles = getNearTiles(map, x, y)
            const nearBlackHoles = nearBlackHolesCount(nearTiles)

            //if(x == 3 && y == 0)
            //    console.log(map[x][y].value, nearBlackHolesCount(nearTiles), (nearBlackHolesCount(nearTiles) < 2 || nearBlackHolesCount(nearTiles) > 3))
            if (isBlackHole(map[x][y].value)) {
                if (nearBlackHoles < 2 || nearBlackHoles > 3)
                    newMap[x][y].value = "." //back to normal tile           
            } else if (nearBlackHoles >= 3) {
                newMap[x][y].value = "&" //becomes a black hole   

                if (isPortal(map[x][y].value)) {
                    const portals = findPortalPair(map, map[x][y].value)
                    portals.forEach(portal => newMap[portal.coords.x][portal.coords.y].value = "&") //Every portal becomes a black hole
                }
            }
        }
    }

    return newMap
}

function nextMove(map: IMap, currentTile: ITile, endPoint: ITile, currentPath: string, portalsUsed: number, stats: IStats) {
    const x: number = currentTile.coords.x;
    const y: number = currentTile.coords.y;

    const nextCells = [
        { x: x, y: y - 1, direction: "N" }, //N - 2
        { x: x - 1, y: y, direction: "W" }, //O - 4
        { x: x + 1, y: y, direction: "E" }, //E - 5
        { x: x, y: y + 1, direction: "S" }, //S - 7
    ] as Array<ICoords>

    //Cerco le prossime caselle in cui spostarmi
    const nextTiles = findTiles(map, nextCells)

    /*
        console.clear()
        console.log(printMap(map, currentTile))
    */

    //Ciclo per tutte le caselle trovate
    for (let nextTile of nextTiles) {
        //Calcolo la mappa successiva qui, perchè ogni percorso non deve influenzare quello di altri
        const nextMap = computeMap(map)

        let newPath = currentPath + nextCells.find(e => e.x == nextTile.coords.x && e.y == nextTile.coords.y)?.direction

        if (stats.minSteps > -1 && newPath.length > stats.minSteps)
            continue;

        //Controllo se cella di arrivo
        if (nextTile.coords.x == endPoint.coords.x && nextTile.coords.y == endPoint.coords.y) {

            if (stats.minSteps == -1)
                stats.minSteps = newPath.length

            if (newPath.length < stats.minSteps) {
                stats.foundPaths = []
                stats.minSteps = newPath.length
                stats.maxPortals = portalsUsed
            }

            //se percorso identico ma più portali usati prendo il percorso che ha più portali
            if (portalsUsed < stats.maxPortals)
                continue;

            if (portalsUsed > stats.maxPortals) {
                stats.foundPaths = []
                stats.minSteps = newPath.length
                stats.maxPortals = portalsUsed
            }

            //Rimuovo tutte le soluzioni che hanno meno portali

            console.log(newPath, newPath.length, stats.minSteps, portalsUsed, stats.maxPortals)

            stats.foundPaths.push({
                path: newPath,
                portalUsed: portalsUsed
            })

            stats.minSteps = newPath.length
            stats.maxPortals = portalsUsed
            continue;
        }


        if (!isBlackHole(nextTile.value)
            && !isBlackHole(nextMap[nextTile.coords.x][nextTile.coords.y].value)
            && !nextTile.isVisited) {

            let nextX = nextTile.coords.x
            let nextY = nextTile.coords.y
            let tmpPortalUsed = portalsUsed
            //Controllo se normal tile o portal
            //Se portale controllo che anche la destinazione non stia per diventare un buconero

            if (isPortal(nextTile.value)) {
                const portals = findPortalPair(map, nextTile.value)
                const portal = (portals[0].coords.x == nextTile.coords.x && portals[0].coords.y == nextTile.coords.y) ? portals[1] : portals[0]

                //Controllo che non diventi un blackhole al prossimo giro
                if (isBlackHole(nextMap[portal.coords.x][portal.coords.y].value) || map[portal.coords.x][portal.coords.y].isVisited) {
                    continue;
                }

                nextMap[portals[0].coords.x][portals[0].coords.y].value = ".";
                nextMap[portals[1].coords.x][portals[1].coords.y].value = ".";

                nextMap[portals[0].coords.x][portals[0].coords.y].isVisited = true;
                nextMap[portals[1].coords.x][portals[1].coords.y].isVisited = true;

                nextX = portal.coords.x
                nextY = portal.coords.y
                tmpPortalUsed++
            }

            nextMap[nextX][nextY].isVisited = true;

            nextMove(nextMap, nextMap[nextX][nextY], endPoint, newPath, tmpPortalUsed, stats)
        }
    }
}

async function main() {
    //Leggo la mappa
    const map: IMap = readMap("map.txt")

    //Cerco punti iniziali e finali
    const [startPoint,
        endPoint]
        = findStartEndPoint(map)


    //Imposto il punto iniziale come visitato e rendo le tile iniziali e finali delle tile normali
    map[startPoint.coords.x][startPoint.coords.y].isVisited = true
    map[startPoint.coords.x][startPoint.coords.y].value = "."
    map[endPoint.coords.x][endPoint.coords.y].value = "."

    //Oggetto per contenere percorsi fatti, path più breve e numero di portali
    const stats: IStats = {
        foundPaths: Array<IPaths>(),
        minSteps: -1,
        maxPortals: -1
    }

    //Eseguo la prima mossa
    nextMove(map, startPoint, endPoint, "", 0, stats)

    console.log(stats)

    //Stampo secondo le regole richieste
    console.log(stats.foundPaths.length + "-" + stats.foundPaths.map(e => e.path).sort().join("") + "-" + stats.maxPortals)

    //Codice per creare cartella con i vari passaggi delle mappe
    /* let tmpMap= map
     for(let i = 0; i < 14; i++)
     {
         fs.writeFileSync("./maps/" + i + ".txt", printMap(tmpMap))
         tmpMap = computeMapStep(tmpMap)
     }*/
}

main()