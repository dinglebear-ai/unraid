#!/usr/bin/env python3
from __future__ import annotations
import base64,hashlib,json,os,socket,struct,sys
path=sys.argv[1] if len(sys.argv)>1 else '/run/unraid-codex/appserver.sock'
key=base64.b64encode(os.urandom(16)).decode()
request=(
    'GET / HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\n'
    'Connection: Upgrade\r\nSec-WebSocket-Version: 13\r\n'
    f'Sec-WebSocket-Key: {key}\r\n\r\n'
).encode()

def recv_exact(sock,n):
    data=b''
    while len(data)<n:
        chunk=sock.recv(n-len(data))
        if not chunk: raise RuntimeError('websocket closed')
        data+=chunk
    return data

def send_text(sock,payload):
    raw=payload.encode(); mask=os.urandom(4); n=len(raw)
    header=bytearray([0x81])
    if n<126: header.append(0x80|n)
    elif n<65536: header.extend([0xFE]); header.extend(struct.pack('!H',n))
    else: header.extend([0xFF]); header.extend(struct.pack('!Q',n))
    masked=bytes(b^mask[i%4] for i,b in enumerate(raw))
    sock.sendall(bytes(header)+mask+masked)

def recv_text(sock):
    first,second=recv_exact(sock,2); opcode=first&0x0F; masked=bool(second&0x80); n=second&0x7F
    if n==126: n=struct.unpack('!H',recv_exact(sock,2))[0]
    elif n==127: n=struct.unpack('!Q',recv_exact(sock,8))[0]
    mask=recv_exact(sock,4) if masked else b''
    payload=recv_exact(sock,n)
    if masked: payload=bytes(b^mask[i%4] for i,b in enumerate(payload))
    if opcode==0x8: raise RuntimeError('websocket closed before initialize response')
    if opcode==0x9:
        sock.sendall(bytes([0x8A,len(payload)])+payload)
        return recv_text(sock)
    return payload.decode()

sock=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM); sock.settimeout(10); sock.connect(path); sock.sendall(request)
response=b''
while b'\r\n\r\n' not in response:
    response+=sock.recv(4096)
status=response.split(b'\r\n',1)[0]
if b' 101 ' not in status: raise SystemExit(f'websocket handshake failed: {status.decode(errors="replace")}')
expected=base64.b64encode(hashlib.sha1((key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()).digest()).decode()
headers=response.decode(errors='replace').lower()
if expected.lower() not in headers: raise SystemExit('websocket accept key mismatch')
initialize={'id':1,'method':'initialize','params':{'clientInfo':{'name':'unraid-codex-health','title':'Unraid Codex Health','version':'1.0.0'},'capabilities':{'experimentalApi':True,'requestAttestation':False,'mcpServerOpenaiFormElicitation':True}}}
send_text(sock,json.dumps(initialize,separators=(',',':')))
for _ in range(20):
    message=json.loads(recv_text(sock))
    if str(message.get('id'))=='1':
        if message.get('error'): raise SystemExit('initialize returned an error')
        print('appserver_initialize=ok')
        sock.close(); raise SystemExit(0)
raise SystemExit('initialize response was not received')
