import numpy as np, gzip, json, struct, sys, os
D='/tmp/mpfb/src/mpfb/data'
A='/home/claude/conv/mha'
OUT='/home/claude/conv/mh/out'; os.makedirs(OUT,exist_ok=True)

# ---- base mesh
V=[];VT=[];grp=None;faces={};members={}
for line in open(D+'/3dobjs/base.obj'):
    if line.startswith('v '): V.append([float(x) for x in line.split()[1:4]])
    elif line.startswith('vt '): VT.append([float(x) for x in line.split()[1:3]])
    elif line.startswith('g '): grp=line.split()[1]
    elif line.startswith('f '):
        c=[p.split('/') for p in line.split()[1:]]
        faces.setdefault(grp,[]).append([(int(a[0])-1,int(a[1])-1) for a in c])
V=np.array(V); VT=np.array(VT)
for g,fl in faces.items():
    members[g]=sorted({vi for f in fl for vi,_ in f})

def tgt(name):
    d=np.zeros_like(V)
    for l in gzip.open(D+'/targets/macrodetails/'+name+'.target.gz','rt'):
        if not l.strip() or l[0]=='#': continue
        s=l.split(); d[int(s[0])]+=[float(s[1]),float(s[2]),float(s[3])]
    return d
AGES=['baby','child','young','old']
W=json.load(open('/tmp/rig/weights.default.json'))['weights']
def wsum(names,n):
    w=np.zeros(n)
    for b in names:
        for i,x in W.get(b,[]): w[i]+=x
    return w
def armw(side):
    s='.'+side
    names=[b for b in W if b.endswith(s) and (b.startswith(('upperarm','lowerarm','wrist','finger','metacarpal')))]
    w=wsum(names,len(V))+0.5*wsum(['shoulder01'+s],len(V))
    return np.clip(w,0,1)
WL,WR=armw('L'),armw('R')
def cen(g,P): return P[members[g]].mean(0)
def rotz(P,c,ang,w):
    ca,sa=np.cos(ang),np.sin(ang)
    d=P-c; R=np.stack([d[:,0]*ca-d[:,1]*sa, d[:,0]*sa+d[:,1]*ca, d[:,2]],1)+c
    return P+(R-P)*w[:,None]
def pose(P):
    for side,w,sg in (('l',WL,1),('r',WR,-1)):
        C=cen(f'joint-{side}-shoulder',P); H=cen(f'joint-{side}-hand',P)
        d=H-C; cur=np.arctan2(abs(d[0]),-d[1]); tgtA=np.radians(9)
        # left arm is on +x: rotating by -(cur-tgt) about z brings hand inward
        ang=-(cur-tgtA)*np.sign(d[0])
        P=rotz(P,C,ang,w)
    return P

def state(g,ag):
    return pose(V+tgt(f'caucasian-{g}-{ag}')+tgt(f'universal-{g}-{ag}-averagemuscle-averageweight'))

# ---- proxies
def load_obj(fn):
    v=[];vt=[];f=[]
    for l in open(fn):
        if l.startswith('v '): v.append([float(x) for x in l.split()[1:4]])
        elif l.startswith('vt '): vt.append([float(x) for x in l.split()[1:3]])
        elif l.startswith('f '):
            c=[p.split('/') for p in l.split()[1:]]
            f.append([(int(a[0])-1,int(a[1])-1) for a in c])
    return np.array(v),np.array(vt),f
def load_mhclo(fn):
    ref=[];sc={};dele=[];mode=None
    for l in open(fn):
        s=l.split()
        if not s or s[0].startswith('#'): continue
        if s[0] in ('x_scale','y_scale','z_scale'): sc[s[0][0]]=(int(s[1]),int(s[2]),float(s[3])); continue
        if s[0]=='verts': mode='v'; continue
        if s[0]=='delete_verts': mode='d'; continue
        if mode=='v':
            if len(s)==1: ref.append(([int(s[0])],[1.0],[0,0,0]))
            elif len(s)>=9 and s[0].lstrip('-').isdigit(): ref.append(([int(x) for x in s[:3]],[float(x) for x in s[3:6]],[float(x) for x in s[6:9]]))
        elif mode=='d':
            toks=' '.join(s).replace('-',' - ').split()
            if not all(t=='-' or t.isdigit() for t in toks): mode=None; continue
            i=0
            while i<len(toks):
                if i+2<len(toks) and toks[i+1]=='-': dele+=range(int(toks[i]),int(toks[i+2])+1); i+=3
                else: dele.append(int(toks[i])); i+=1
    return ref,sc,dele
def fit(ref,sc,P):
    s=np.ones(3)
    for k,ax in (('x',0),('y',1),('z',2)):
        if k in sc: a,b,den=sc[k]; s[ax]=abs(P[a][ax]-P[b][ax])/den
    out=np.zeros((len(ref),3))
    for i,(vi,w,o) in enumerate(ref):
        out[i]=sum(P[v]*ww for v,ww in zip(vi,w))+np.array(o)*s
    return out

def unify(fl):
    """faces of (vi,ti) -> unique verts, tris"""
    key={};vis=[];tis=[];tris=[]
    for f in fl:
        ids=[]
        for vi,ti in f:
            k=(vi,ti)
            if k not in key: key[k]=len(vis); vis.append(vi); tis.append(ti)
            ids.append(key[k])
        for j in range(1,len(ids)-1): tris.append([ids[0],ids[j],ids[j+1]])
    return np.array(vis),np.array(tis),np.array(tris,dtype=np.uint32)

SETS={'female':{'suit':'female_casualsuit01','hair':'bob02'},'male':{'suit':'male_casualsuit02','hair':'short02'}}
for g,cfg in SETS.items():
    S=[state(g,a) for a in AGES]
    parts=[]  # name, vis-based positions per state (list), uv, tris
    dele=set()
    prox=[('eyes','low-poly'),('brows','eyebrow001'),('lashes','eyelashes01'),('suit',cfg['suit']),('shoes','shoes02'),('hair',cfg['hair'])]
    pdata=[]
    for name,base in prox:
        ref,sc,dl=load_mhclo(f'{A}/{base}.mhclo')
        if name in ('suit','shoes'): dele|=set(dl)
        pv,pvt,pf=load_obj(f'{A}/{base}.obj')
        assert len(pv)==len(ref),(base,len(pv),len(ref))
        vis,tis,tris=unify(pf)
        pos=[fit(ref,sc,P)[vis] for P in S]
        uv=pvt[tis]
        pdata.append((name,pos,uv,tris,vis))
    bf=[f for f in faces['body'] if not any(vi in dele for vi,_ in f)]
    vis,tis,tris=unify(bf)
    pdata.insert(0,('body',[P[vis] for P in S],VT[tis],tris,vis))
    hdr=[];blobs=[]
    def nrm(P,vis,tris):
        # smooth normals welded by base vertex id
        uid,inv=np.unique(vis,return_inverse=True)
        Q=P; N=np.zeros((len(uid),3))
        a,b,c=Q[tris[:,0]],Q[tris[:,1]],Q[tris[:,2]]
        fn=np.cross(b-a,c-a)
        for k in range(3): np.add.at(N,inv[tris[:,k]],fn)
        N/=np.linalg.norm(N,axis=1,keepdims=True)+1e-12
        return N[inv]
    for name,pos,uv,tris,vis in pdata:
        n=len(uv)
        hdr.append({'name':name,'n':n,'t':len(tris)})
        q=[np.round(P*0.1*10000).astype(np.int32) for P in pos]
        blobs.append(q[0].astype(np.int16).tobytes())
        for k in (1,2,3): blobs.append((q[k]-q[0]).astype(np.int16).tobytes())
        for P in pos: blobs.append(np.round(nrm(P,vis,tris)*127).astype(np.int8).tobytes())
        blobs.append(np.round(np.clip(uv,0,1)*65535).astype(np.uint16).tobytes())
        blobs.append(tris.astype(np.uint16).tobytes())
        print(g,name,n,len(tris))
    h=json.dumps(hdr).encode(); h+=b' '*((4-len(h)%4)%4)
    out=[struct.pack('<I',len(h)),h]
    for b in blobs: out.append(b+b'\0'*((4-len(b)%4)%4))
    raw=b''.join(out)
    open(f'{OUT}/mh_{g}.bin.gz','wb').write(gzip.compress(raw,9))
    print(g,len(raw),os.path.getsize(f'{OUT}/mh_{g}.bin.gz'))
    # heights
    for i,a in enumerate(AGES): print(a,'height m',(S[i][:,1].max()-S[i][:,1].min())*0.1)
