"""Afegeix pantalla de càrrega + mode lleuger a tots els labs (idempotent)."""
import re,glob,os,sys
here=os.path.dirname(os.path.abspath(__file__)); js=open(os.path.join(here,'ux_lite.js')).read()
files=sys.argv[1:] or [os.path.join(here,'..','index.html')]+glob.glob(os.path.join(here,'..','labs','*.html'))
for f in files:
    s=open(f,encoding='utf-8').read()
    s=re.sub(r'<script id="mlux">.*?</script>','',s,flags=re.S)
    s=re.sub(r' *setTimeout\(\(\)=>window\.__LITE&&__LITE\(renderer,scene\),0\);','',s)
    m=re.search(r'<body[^>]*>',s); 
    if not m: print('no body',f); continue
    s=s[:m.end()]+'<script id="mlux">'+js+'</script>'+s[m.end():]
    mm=re.search(r'\brenderer=new THREE\.WebGLRenderer\(',s); i=mm.start() if mm else -1
    if i>=0:
        j=s.find(');',i)+2; s=s[:j]+' setTimeout(()=>window.__LITE&&__LITE(renderer,scene),0);'+s[j:]
    open(f,'w',encoding='utf-8').write(s); print(os.path.basename(f),'ok','3d' if i>=0 else '-')
