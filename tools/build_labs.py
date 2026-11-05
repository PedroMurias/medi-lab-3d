import sys
n=sys.argv[1]
s=open(f'{n}.src.html').read()
s=s.replace('/*BASECSS*/',open('/home/claude/base.css').read()).replace('/*KIT*/',open('kit.js').read()+'\n'+open('ux.js').read()+'\n'+open('vis.js').read()+'\n'+open('walk.js').read())
s=s.replace('/*WORLD*/',open('world110.json').read()).replace('/*ESP*/',open('esp50.json').read()).replace('/*EU*/',open('eu110.json').read())
s=s.replace('/*CRITTERS*/',open('eco_critters.js').read()).replace('/*ECOASSETS*/',open('eco_assets.js').read())
s=s.replace('/*NATKIT*/',open('nat_kit.js').read()).replace('/*HISTSCENES*/',open('hist_scenes.js').read()+'\n'+open('hist_props.js').read()+'\n'+open('hist_museum.js').read())
s=s.replace('/*MHJS*/',open('/home/claude/conv/mh/mh.js').read()).replace('/*MHDATA*/',open('/home/claude/conv/mh/out/mhdata.js').read()) if n=='adolescencia' else s
open(f'{n}.html','w').write(s); print(n,len(s))
