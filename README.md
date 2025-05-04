# Foto

##### Languages and Tools

Foto depends on these languages and tools, make sure to install them and had them be
available in your `PATH` environment variable.

```
1. NodeJS (node)
2. Python (python)
3. npm
4. ffmpeg
5. go (GoLang)
```

#### Psycopg (PostgreSQL Server for Python) 
The bootstrap script depends in this library, so it must be installed first
before running the bootstrap:
```
pip install psycopg
```

##### NPM packages

Foto depends on several npm packages like TypeScript, Fastify. We must first install these 
dependencies using `npm install`

## Ease of Development
**Building and running the server (dev mode)**

The bootstrap automatically takes care of setups (e.g., database cluster, creation of database, 
transpiling) and booting up several components needed by foto to run (e.g.,PostgreSQL, 
the server itself).
```
python bootstrap.py dev
```

**Running tests**
```
python foto.py test
```