set size square
rgb(r,g,b) = 65536 * int(r) + 256 * int(g) + int(b)
plot 'results.dat' using 1:2:(rgb(0,($3-5)*60,0)) with points pointsize 1 pointtype 3 linecolor rgbcolor variable
