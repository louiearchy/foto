# Foto


### Dependencies


#### Fonts

Foto uses additional fonts for its website, make sure to download the following fonts by clicking
their links and putting it on a newly created folder:

1. [Work Sans](https://fonts.google.com/specimen/Work+Sans)

Once you have downloaded, make sure that the zip files are stored in a newly created
folder, for this example, we would name our folder `fonts`. Now, we go to the root
of the **foto** project, and you would see the script named `foto.py`, we would use
this script to help us with unpacking these fonts. In order to do that, you just need
to run the following command:

```
python foto.py --pack-fonts=<path/to/the/created/folder>
```

Since in this example, our folder is named `fonts`, the following command would look like
this:

```
python foto.py --pack-fonts="fonts/"
```

##### Languages and Tools

Foto depends on these languages and tools, make sure to install them and had them be
available in your `PATH` environment variable.

```
1. NodeJS (node)
2. Python (python)
3. npm
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