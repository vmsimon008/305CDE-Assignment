/* import custom module */
var mongo = require('./schema.js')
/* import the HTTP client module */
var request = require('request')

/* set up the base URL */
const url = 'https://www.googleapis.com/books/v1/volumes'
const subjects = ['business', 'computers'];
const get_fields = 'items(volumeInfo(title,subtitle,authors,publisher,publishedDate,description,industryIdentifiers,pageCount,categories,imageLinks),saleInfo(listPrice))'

var currencies = {}

/* function to check if username has already registered */
function validateUser(username) {
    return new Promise((resolve, reject) => {
        mongo.findUser(username).toArray((err, result) => {
            if (result.length > 0) {
                resolve(false)
            }
            else {
                resolve(true)
            }
        })
    })
}

/* function for getting books from Google Books API (categories: business , computers) */
function getBooksFromGoogle() {
    return new Promise((resolve, reject) => {
        var books = []
        for (let i = 0; i < subjects.length; i++) {
            var query_string = { q: '' + '+subject:' + subjects[i], printType: 'books', langRestrict: 'en', filter: 'paid-ebooks', orderBy: 'newest', fields: get_fields, maxResults: 20 }
            request.get({ url: url, qs: query_string }, (err, res, body) => {
                if (err) {
                    reject(console.log(err))
                }
                else {
                    const json = JSON.parse(body)
                    for (var book of json.items) {
                        books.push(book)
                    }
                }
            })
        }
        setTimeout(() => {
            if (books.length > 0) {
                resolve(books)
            }
            else {
                reject(console.log('Error while getting books'))
            }
        }, 2000)
    })
}

/* function for getting currency from third party API (base:USD) */
function getCurrency() {
    return new Promise((resolve, reject) => {
        getBooksFromGoogle().then((books) => {
            request.get('http://www.mycurrency.net/service/rates', (err, res, body) => {
                if (err) {
                    reject(console.log(err))
                }
                else {
                    const json = JSON.parse(body)
                    for (var currency of json) {
                        //console.log(currency)
                        if (currency['currency_code'] == 'HKD') {
                            currencies.HKD = currency['rate']
                        }
                        else if (currency['currency_code'] == 'EUR') {
                            currencies.EUR = currency['rate']
                        }
                        else if (currency['currency_code'] == 'GBP') {
                            currencies.GBP = currency['rate']
                        }
                    }
                    resolve(books)
                }
            })
        })
    })
}

/* a module function for creating book data which combined and got data from third party APIs */
/* all book data will store to MongoDB after created */
exports.prepareDB = () => {
    getCurrency().then((books) => {
        for (var book of books) {
            if (book['volumeInfo'].industryIdentifiers && book['saleInfo']['listPrice'].amount > 0) {
                new Promise((resolve, reject) => {
                    var bookOnDB = {}
                    if (book['volumeInfo'].subtitle) {
                        bookOnDB.title = book['volumeInfo'].title + ' ' + book['volumeInfo'].subtitle
                    }
                    else {
                        bookOnDB.title = book['volumeInfo'].title
                    }
                    bookOnDB.authors = book['volumeInfo'].authors
                    bookOnDB.publisher = book['volumeInfo'].publisher
                    bookOnDB.publishedDate = book['volumeInfo'].publishedDate
                    bookOnDB.ISBNs = {}
                    for (var isbn of book['volumeInfo'].industryIdentifiers) {
                        if (isbn.type == 'ISBN_13') {
                            bookOnDB.ISBNs.ISBN13 = isbn.identifier
                        }
                        else {
                            bookOnDB.ISBNs.ISBN10 = isbn.identifier
                        }
                    }
                    bookOnDB.pageCount = book['volumeInfo'].pageCount
                    bookOnDB.categories = book['volumeInfo'].categories
                    bookOnDB.imageLinks = book['volumeInfo'].imageLinks
                    bookOnDB.amounts = {}
                    bookOnDB.amounts.USD = (book['saleInfo']['listPrice'].amount).toString()
                    bookOnDB.amounts.HKD = (book['saleInfo']['listPrice'].amount * currencies.HKD).toFixed(2)
                    bookOnDB.amounts.GBP = (book['saleInfo']['listPrice'].amount * currencies.GBP).toFixed(2)
                    bookOnDB.amounts.EUR = (book['saleInfo']['listPrice'].amount * currencies.EUR).toFixed(2)

                    resolve(bookOnDB)
                }).then((bookOnDB) => {
                    /* check if book data is already exist on MongoDB */
                   /* if not, insert a new record, otherwise, just update the record */
                    mongo.findBook(bookOnDB.ISBNs.ISBN13).then((result) => {
                        if (result > 0) {
                            mongo.updateBook(bookOnDB)
                        }
                        else {
                            mongo.addBook(bookOnDB)
                        }
                    })
                })
            }
        }
    }).then(() => {
        console.log('Books got!')
    }).catch((err) => {
        console.log(err)
    })
}

/* a module function for getting all stored books on MongoDB */
exports.getAllBooks = () => {
    return new Promise((resolve, reject) => {
        mongo.getAllBooks().toArray((err, result) => {
            if (err) {
                reject({ code: 400, contentType: 'application/json', response: { status: 'Error', message: err } })
            }
            else {
                resolve({ code: 200, contentType: 'application/json', response: result })
            }
        })
    })
}

/* a module function for getting a stored books on MongoDB by it's ISBN 13 */
exports.getBookByISBN = (isbn13) => {
    return new Promise((resolve, reject) => {
        mongo.getBook_isbn(isbn13).toArray((err, result) => {
            if (err) {
                reject({ code: 400, contentType: 'application/json', response: { status: 'Error', message: err } })
            }
            else {
                resolve({ code: 200, contentType: 'application/json', response: result[0] })
            }
        })
    })
}

/* a module function for getting all stored books on MongoDB by their category */
exports.getBookByCategory = (category) => {
    return new Promise((resolve, reject) => {
        mongo.getBook_category(category).toArray((err, result) => {
            if (err) {
                reject({ code: 400, contentType: 'application/json', response: { status: 'Error', message: err } })
            }
            else {
                resolve({ code: 200, contentType: 'application/json', response: result })
            }
        })
    })
}

/* a module function for getting a stored user on MongoDB by it's username */
exports.getUser = (username) => {
    return new Promise((resolve, reject) => {
        mongo.getUser(username).toArray((err, result) => {
            if (err) {
                reject({ code: 400, contentType: 'application/json', response: { status: 'Error', message: err } })
            }
            else {
                resolve({ code: 200, contentType: 'application/json', response: result[0] })
            }
        })
    })
}

/* a module function for registering a new user and storing it on MongoDB */
exports.registerUser = (auth, body) => {
    return new Promise((resolve, reject) => {
        validateUser(body.username).then((valid) => {
            if (auth.basic === undefined) {
                reject({ code: 401, contentType: 'application/json', response: { status: 'Error', message: 'Missing basic auth' } })
            }
            else if (auth.basic.username !== 'testor' || auth.basic.password !== '654321') {
                reject({ code: 401, contentType: 'application/json', response: { status: 'Error', message: 'Invalid credentials' } })
            }
            else if (valid === false) {
                reject({ code: 400, contentType: 'application/json', response: { status: 'Error', message: 'Username already exist' } })
            }
            else {
                mongo.registerUser(body)
                resolve({ code: 201, contentType: 'application/json', response: { status: 'Success', message: 'New user registered', data: body } })
            }
        }).catch((err) => {
            console.log(err)
        })
    })
}

/* a module function for updating a user's information on MongoDB (by it's username) */
exports.updateUser = (auth, body, username) => {
    return new Promise((resolve, reject) => {
        validateUser(username).then((valid) => {
            if (auth.basic === undefined) {
                reject({ code: 401, contentType: 'application/json', response: { status: 'Error', message: 'Missing basic auth' } })
            }
            else if (auth.basic.username !== 'testor' || auth.basic.password !== '654321') {
                reject({ code: 401, contentType: 'application/json', response: { status: 'Error', message: 'Invalid credentials' } })
            }
            else if (valid === true) {
                reject({ code: 400, contentType: 'application/json', response: { status: 'Error', message: 'Username not exist' } })
            }
            else {
                mongo.updateUser(username, body).then((result) => {
                    resolve({ code: 200, contentType: 'application/json', response: { status: 'Success', message: 'User updated' } })
                })
            }
        })
    })
}
