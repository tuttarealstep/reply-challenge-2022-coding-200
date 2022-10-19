import string

data = """..B.
a..&
&.&&
aA.&
"""

with open("map.txt", "r") as f:
    data=f.read()

initial_maze = list(map(lambda x : list(x), data.split("\n")))[:-1]

surrounding = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1,1)]
moves = {
    "N": (-1, 0),
    "W": (0, -1),
    "E": (0, 1),
    "S": (1, 0)
}

def safe_get(maze, x, y, dx, dy):
    if x + dx < 0:
        return None
    if x + dx >= len(maze):
        return None
    
    if y + dy < 0:
        return None
    
    if y + dy >= len(maze[0]):
        return None

    return maze[x+dx][y+dy]

def safe_v_get(maze, visited, x, y, dx, dy):
    #print(visited)
    if (x+dx,y+dy) in visited:
        return None
    return safe_get(maze, x, y, dx, dy)

def deepcopy(maze):
    newmaze = []
    for c in maze:
        newmaze.append(c[:])
    return newmaze

def destroy_portals(maze, pl, newstate):
    for i in range(len(maze)):
        for j in range(len(maze[0])):
            if maze[i][j] == pl:
                maze[i][j] = newstate


class State:
    def __init__(self, mazeState, px, py, depth, portalcount, path, visited):
        self.mazeState = mazeState
        self.px = px
        self.py = py
        self.depth = depth
        self.portalcount = portalcount
        self.path = path
        self.visited = visited

    def dump(self):
        print("%d %d [%d,%d] %s" % (self.depth, self.portalcount, self.px, self.py, self.path))

class MazeState:
    def __init__(self, maze, portals):
        self.maze = maze
        self.portals = portals
        
    def dumpmaze(self):
        print("\n".join(map(lambda x : "".join(x), self.maze)))

    def get_next_maze(self):
        newmaze = deepcopy(self.maze)
        newportals = self.portals.copy()
        
        for i in range(len(self.maze)):
            for j in range(len(self.maze[0])):
                around = 0
                for (dx, dy) in surrounding:
                    if safe_get(self.maze, i, j, dx, dy) == "&":
                        around += 1
                
                if self.maze[i][j] == "&": #black hole
                    if around != 2 and around != 3:
                        newmaze[i][j] = "."
                else:
                    if around >= 3:
                        newmaze[i][j] = "&"
                        #check if destroyed portal
                        if self.maze[i][j] in string.ascii_lowercase:
                            if self.maze[i][j] in newportals:
                                del newportals[self.maze[i][j]]
                            destroy_portals(newmaze, self.maze[i][j], "&")

        

        return MazeState(newmaze, newportals)

    def destroyed_portal(self, pl):
        newmaze = deepcopy(self.maze)
        newportals = self.portals.copy()
        
        
        del newportals[pl]
        destroy_portals(newmaze, pl, ".")
        return MazeState(newmaze, newportals)

                    


for i in range(len(initial_maze)):
    if "A" in initial_maze[i]:
        psx = i
        psy = initial_maze[i].index("A")
        initial_maze[psx][psy] = "."
    if "B" in initial_maze[i]:
        gx = i
        gy = initial_maze[i].index("B")
        initial_maze[gx][gy] = "."

portals = {}
for pl in string.ascii_lowercase:
    o1 = None
    o2 = None
    for i in range(len(initial_maze)):
        for j in range(len(initial_maze[0])):
            if initial_maze[i][j] == pl:
                if o1:
                    o2 = (i, j)
                    portals[pl] = (o1, o2)
                    break
                else:
                    o1 = (i, j)

   
first_state = MazeState(initial_maze, portals)

mindepth = -1
q = []
q.append(State(first_state, psx, psy, 0, 0, "", []))

solutions = []

cache = []

while True:
    state = q.pop(0)
    key = (state.depth, state.px, state.py, "".join(state.mazeState.portals.keys()))
    #if key in cache:
    #    continue
    #cache.append(key)
    #print(state.path)
    
    #state.dump()
    if False:#"WEEN".startswith(state.path):
        state.dump()
        state.mazeState.dumpmaze()

    if mindepth != -1 and state.depth > mindepth:
        break
    if state.px == gx and state.py == gy:
        #print("Goal!")
        mindepth = state.depth
        solutions.append(state)
        
        continue

    mazeState = state.mazeState
    next_maze_state = mazeState.get_next_maze()
    for move in moves:
        (dx, dy) = moves[move]
        origtarg = safe_v_get(mazeState.maze, state.visited, state.px, state.py, dx, dy)
        if origtarg is None:
            continue #OOB
        nexttarg = safe_get(next_maze_state.maze, state.px, state.py, dx, dy)
        if origtarg == "&" or nexttarg == "&":
            continue #black hole
        if origtarg in next_maze_state.portals:
            if (state.px+dx,state.py+dy) == mazeState.portals[origtarg][0]:
                (newpx, newpy) = mazeState.portals[origtarg][1]
            else:
                (newpx, newpy) = mazeState.portals[origtarg][0]
            q.append(State(next_maze_state.destroyed_portal(origtarg), newpx, newpy, state.depth+1, state.portalcount+1, state.path + move, state.visited + [(newpx, newpy), (state.px+dx,state.py+dy)]))
        else:
            (newpx, newpy) = (state.px+dx, state.py+dy)
            q.append(State(next_maze_state, newpx, newpy, state.depth+1, state.portalcount, state.path + move, state.visited + [(newpx, newpy)]))
        




max_portals = max(map(lambda x : x.portalcount, solutions))
print(max_portals)

maxsols = filter(lambda x : x.portalcount == max_portals, solutions)
paths = sorted(list(map(lambda x : x.path, maxsols)))

print(paths)
print("%d-%s-%d" % (len(paths),"".join(paths), max_portals))