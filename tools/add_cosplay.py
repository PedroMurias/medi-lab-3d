import re
p='labs/cos.html'; s=open(p).read()
s=re.sub(r'<script id="cosPlay">.*?</script><!--/cosPlay-->','',s,flags=re.S)
js=open('/home/claude/labs/esp_play.js').read()+'\n'+open('tools/cos_cm.js').read()
i=s.rfind('</body>'); s=s[:i]+'<script id="cosPlay">'+js.replace('</script>','<\\/script>')+'</script><!--/cosPlay-->\n'+s[i:]
open(p,'w').write(s); print('ok')
