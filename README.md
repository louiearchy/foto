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

#### Python libraries

The foto script named `foto.py` depends on a package called `psycopg` which would be needed
in the automated setting up of database at every start up of the server. To install the said 
package, all you have to do is to run the following command:

```
pip install psycopg
```

##### NPM packages

Foto depends on several npm packages like TypeScript, Fastify. We must first install these 
dependencies using `npm install` if it's the first time you have acquired this project and
you're setting up your development environment

### Building & Running Server
Being in this stage, I assume that you have installed the dependencies needed. To build and
run the server, you only need to run the `foto.py`, by doing this:

```
python foto.py
```

This script automatically takes care of the building of the server, and then as it succesfully
builds the server, it will then run the development server.

### Running Server on different IP address

To run the development server on a different ip address other than the `localhost` (which is the default),
just do the following command:

```
python foto.py --host=<host>
```


### Running tests

```
python foto.py test
```



### Other tasks
Use these tasks to make your development easier:

```
python foto.py clean-data
```
This task deletes the images (and thumbnails) that have been uploaded, and erases any records in 
all of the tables in the `fotodb` database

<br>

```
python foto.py hard-reset
```
This task do what the `clean-data` does, but it also deletes the database cluster which erases all
of the tables; also deletes the compiled files in the `built/` folder. This is useful when you
may have changed something in the database schema, and/or there are compiled-files-related issues that you
think may be resolved if the compiled files were to be deleted