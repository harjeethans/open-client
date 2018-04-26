# A client for Open API Specification.

We can use this api client for node server and browser client environments. All we need to provide are a server and specs and
all the apis can be invoked afterwards with a simple api. There are plenty of client libraries available but all of these miss
something or the other. None of these have all the features we desire and also and custom extensions we do the schema may run
these into issues. Philosophy is to be minimalistic and write enough to have us moving, we can add if we have missed something.

##### Here are some of the features

1. Workes on specs alone.
2. Will fetch the specs and normalize any references inline to avoid future resolutions.
3. Has apis like getSpecs, getParameters etc to have a good understanding of what we are dealing with. Refer NuClient for complete list.
4. Inbuilt validation of body/payload against the schema for type, required etc. We can also add custom validators if we need. It relies on [ajv](https://github.com/epoberezkin/ajv/) for validations.
5. Uses async/await for api calls, we can do generators if async/await does not suffice everyone.
6. Gives us ability to abort in-flight calls on node and browser environments.
7. We can also invoke api endpoints in a batch if we so desire, this saves us lots of unecessary callback code in scenarios when we need to invoke more then one endpoint to move on.


##### How to use.

As most of our front-end code base can leverage ES6 and we run our oun build along with compiler (babel), we can use it as a npm dependency and pick its required code using webpack/roolup/browserify. Minified nu-open-client.js is also available for older clients. Using as source dependency is recommended.

```shell
npm install --save-dev nu-open-client
```

##### Used by

##### For something missing/wrong/idea/enhancement

Please file an [issue](https://github.com/harjeethans/open-client) 
