s=open('src.html').read()
s=s.replace('/*EXDATA*/',open('/home/claude/za/ex_line.txt').read().rstrip('\n'),1)
s=s.replace('<script src="cos.js"></script>','<script id="model-data">/* Model 3D (glTF + meshopt, base64). Z-Anatomy CC BY-SA 4.0 · BodyParts3D CC BY-SA 2.1 JP */\n'+open('cos.js').read()+'</script>',1)
css=open('/home/claude/base.css').read(); css=css[css.index('/* ===== UX kit ===== */'):]
s=s.replace('/*UXCSS*/',css).replace('/*UXJS*/',open('/home/claude/labs/ux.js').read()+'\n'+open('/home/claude/labs/vis.js').read())
open('index.html','w').write(s); print(len(s))
