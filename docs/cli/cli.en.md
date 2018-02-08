# Using the command line

To use ENB from the command line, install the `npm` package for `enb`.
Run commands in the root directory of the project.

Building all project pages:

```
./node_modules/.bin/enb make
```

Building all project pages and clearing the cache:

```
./node_modules/.bin/enb make --no-cache
```

Building all project pages and getting the build graph:

```
./node_modules/.bin/enb make --graph
```

Building all project pages with profiling enabled (counts the work time of targets and technologies):

```
./node_modules/.bin/enb make --profiler
```

Building all project pages and recording the build data (the profiling results) in a file:

```
./node_modules/.bin/enb make --build-info-file="build-info.json"
```

Building a project page:

```
./node_modules/.bin/enb make pages/index
```

Building a specific file:

```
./node_modules/.bin/enb make pages/index/index.html
```

Running the server mode:

```
./node_modules/.bin/enb server
```

Disabling color formatting in the progress log in the console:

```
NOCOLOR=1 ./node_modules/.bin/enb make
```

Sets the limit for open files in asynchronous operations. The correct limit helps avoid `EMFILE` errors:

```
ENB_FILE_LIMIT=100 ./node_modules/.bin/enb make
```
