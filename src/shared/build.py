import sys
n=sys.argv[1]
s=open(f'{n}.src.html').read()
s=s.replace('/*BASECSS*/',open('/home/claude/base.css').read()).replace('/*KIT*/',open('kit.js').read()+'\n'+open('ux.js').read()+'\n'+open('vis.js').read()+'\n'+open('walk.js').read())
s=s.replace('/*WORLD*/',open('world110.json').read()).replace('/*ESP*/',open('esp50.json').read()).replace('/*EU*/',open('eu110.json').read()).replace('/*CCAA*/',open('ccaa.json').read()).replace('/*PROV*/',open('prov.json').read())
s=s.replace('/*CRITTERS*/',open('eco_critters.js').read()).replace('/*ECOASSETS*/',open('eco_assets.js').read()).replace('/*ECOLAND*/',open('eco_land.js').read())
s=s.replace('/*WALKJS*/',open('walk.js').read())
s=s.replace('/*FARMASSETS*/',open('farm_assets.js').read())
s=s.replace('/*DEMESP*/',open('dem_esp.js').read())
s=s.replace('/*MUSASSETS*/',open('mus_assets.js').read())
s=s.replace('/*SHIPASSETS*/',open('ship_assets.js').read())
s=s.replace('/*REPTEIMG*/',open('repte_img.js').read())
s=s.replace('/*REPTEQ*/',open('repte_q.js').read())
s=s.replace('/*HUBASSETS*/',open('hub_assets.js').read())
s=s.replace('/*CITYASSETS*/',open('city_assets.js').read()+'\n'+open('city_inst.js').read())
s=s.replace('/*NATKIT*/',open('nat_kit.js').read()).replace('/*CITYKIT*/',open('city_kit.js').read()).replace('/*CIUSCENES*/',open('ciu_scenes.js').read()).replace('/*ODSTEX*/',open('ods_tex.js').read()).replace('/*FLAGS*/',open('flags.js').read()).replace('/*PEOPLE*/',open('people_assets.js').read()+'\n'+open('people.js').read()).replace('/*HISTSCENES*/',open('hist_scenes.js').read()+'\n'+open('hist_props.js').read()+'\n'+open('hist_museum.js').read())
s=s.replace('/*MHJS*/',open('/home/claude/conv/mh/mh.js').read()).replace('/*MHDATA*/',open('/home/claude/conv/mh/out/mhdata.js').read()) if n=='adolescencia' else s
if n!='hub':
    home=open('/home/claude/labs/homebtn.html').read()
    s=s.replace('</body>',home+'</body>',1) if 'id="homeBtn"' not in s else s
open(f'{n}.html','w').write(s); print(n,len(s))
