# V.2 

Some stuff that I wanted to do in V.2 

- originally wanted to do this in TS, but kind of pointless, building library using TS is fine but this is an actual application. So node.js native 
- Swap Koa - but won't happen now until V.3, but this time I will try to make the actual http / websocket engine more generic, see next 
- Proxy from the start - what this means is, the client facing side will be a proxy server, and then all the service provided will be behind this proxy. This is BIGGEST change in terms of architect of this application. And allow me to swap out the engine anytime I want - since the api is completely decoup from code - and become micro-service like architect. 
- HMR front to back, back to front - having study the Vite source code, the HMR is really nothing special, I have been trying to implement it with some success back in the old version. But ditch them afterward. Because I want a more universal approach - not binding to any particular framework, new framework comes out almost everyday, but sticking to a standard practice will allow this application out live the frameworks. 

Joel 2022 