/* import custom module */
var processData = require('./processData.js')

/* import the 'restify' module and create an instance. */
var restify = require('restify')
var server = restify.createServer()

/* import the required plugins to parse the body and auth header. */
server.use(restify.fullResponse())
server.use(restify.bodyParser())
server.use(restify.authorizationParser())

/* get books data and currency data from third party API and store it on my MongoDB */
console.log('Start getting books from Google...');
processData.prepareDB()

/* set the server listen to port 8080 */
var port = process.env.PORT || 8080;
server.listen(port, function(err) {
    if (err) {
        console.error(err);
    }
    else {
        console.log('App is ready at : ' + port);
    }
})


/* if we receive a GET request for the base URL redirect to /lists */
server.get('/', (req, res, next) => {
    res.redirect('/books', next)
})

/* setup a route to handle GET request for getting all books data from MongoDB */
server.get(/^\/books$/, (req, res, next) => {
    processData.getAllBooks().then((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    }).catch((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    })
})

/* setup a route to handle GET request for getting a book data by it's ISBN */
server.get('/books/isbn_13/:ISBN13', (req, res, next) => {
    const isbn13 = req.params.ISBN13
    processData.getBookByISBN(isbn13).then((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    }).catch((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    })
})

/* setup a route to handle GET request for getting books data by their category */
server.get('/books/category/:CAT', (req, res, next) => {
    const category = req.params.CAT
    processData.getBookByCategory(category).then((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    }).catch((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    })
})

/* setup a route to handle GET request for getting a user data by it's username */
server.get('/user/:username', (req, res, next) => {
    const username = req.params.username
    processData.getUser(username).then((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    }).catch((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    })
})

/* setup a route to handle POST request for registering user and store user data to mongoDB */
server.post('/registeruser', (req, res) => {
    const body = req.body
    const auth = req.authorization
    processData.registerUser(auth,body).then((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    }).catch((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    })
})

/* setup a route to handle PUT request for updating user information  */
server.put('/user/:username', (req, res) => {
    const body = req.body
    const auth = req.authorization
    const username = req.params.username
    processData.updateUser(auth,body,username).then((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    }).catch((data) => {
        res.setHeader('content-type', data.contentType)
        res.send(data.code, data.response)
        res.end()
    })
})
