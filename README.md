# aMAZEing portals

R-boy is in trouble! As the adventurers who preceeded him, he ran into a space room: help him escape before the black holes get him!

R-boy has to run **from 'A' to 'B'**, walking freely on normal tiles ('.') but avoiding black holes ('&').
He can walk in all **4 directions (N-E-S-W)**, and he **can't move twice on the same tile**.

The black holes change at **every step** R-boy takes:
- each black hole can live on if it's **surrounded (in all 8 directions) by ``exactly 2 or 3`` other black holes**, otherwise it extinguishes;
- each normal tile can become a black hole if it's **surrounded (in all 8 directions) by ``3 or more`` black holes**.

R-boy can't walk into black holes, or tiles that are going to become a black hole while he stands there. \
For instance, in the following situation (where @ is current position of R-boy):
```
....
...&
&@.&
...&
```
he can't go west (as there is a black hole there), but he can't go east either, as after his move the tiles on his right will become a black hole too.

In the map there are also some **portals** (lowercase letters, e.g. 'a') that can help R-boy traversing the space room.
Every portal has one **twin-portal labelled with the same lowercase letter**. When R-boy walks into a portal, he gets teleported to the corresponding twin-portal instantly. \
Teleporting doesn't count as a move, so **walking in a portal + teleporting to the twin portal consumes one move only**. \
Portals can be used **just once**. When using a portal, **both twin-portals count as visited** and they will both deactivate.

Pay attention as **portal tiles behave as normal tiles**: they will transform into black holes if **surrounded (in all 8 directions) by ``3 or more`` black holes**. \
If a portal tile transforms into a black hole, it **can't be used anymore** even if it extinguishes. Also, the **corresponding twin-portal will transform into a black hole instantly** and can't be used too.

Routes are expressed as the directions in which R-boy moves: N, S, W, E. 
Help R-boy find all the **best routes** to the exit, using **the lowest number of moves**. \
In case of equality, the best routes are the ones using **the highest number of portals**. \
All the solutions with the same number of moves and same number of portals are equivalent.

A password is needed to open the exit door in the format **N-s-P**, where:
- N: the **number of the best solutions** possible;
- s: the **concatenation** of all the best solutions, firstly **sorted in lexical order**;
- P: the **number of portals** used in the path.

For example, in the following map:
```
..B.
a..&
&.&&
aA.&
```
both the paths NNNE and WNEE are possible with 4 moves, but the second one makes use of portal 'a' so it's better.
The best solutions for this map (in lexical order) are: WENE and WNEE using 1 portal. \
So the password would be: 2-WENEWNEE-1



---
IMPORTANT! - Some tools for opening encrypted zip files show some issues in decrypting the zip containing the flag. Please don't trust the windows explorer unzip tool on Windows machine or unzip also in Unix machine. Use instead other tools such as for example 7zip.