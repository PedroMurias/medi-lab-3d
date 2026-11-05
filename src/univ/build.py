s=open('src.html').read()
s=s.replace('/*TOPOJSON*/',open('node_modules/topojson-client/dist/topojson-client.min.js').read()).replace('/*LAND*/',open('node_modules/world-atlas/land-110m.json').read())
css=open('/home/claude/base.css').read(); css=css[css.index('/* ===== UX kit ===== */'):]
s=s.replace('/*UTEX*/',open('utex.js').read()).replace('/*UXCSS*/',css).replace('/*UXJS*/',open('/home/claude/labs/ux.js').read()+'\n'+open('/home/claude/labs/vis.js').read())
open('univers.html','w').write(s)
