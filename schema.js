var mongoose = require('mongoose')
const server = 'mongodb://testor:654321@ds257808.mlab.com:57808/vmsimon'
console.log('connect to server: '+ server)
mongoose.connect(server)
const db = mongoose.connection
/*var Schema = mongoose.Schema

var listSchema = new Schema({
    name: { type: String, required: true },
    items: [ {type: String} ]
})

exports.List = mongoose.model('tessst', listSchema)*/

exports.getAllBooks = () => {
    return db.collection('booklist').find({})
}

exports.getBook_isbn = (isbn13) => {
    return db.collection('booklist').find({ 'ISBNs.ISBN13': isbn13 })
}

exports.getBook_category = (category) => {
    return db.collection('booklist').find({ 'categories': { $regex : category, $options : 'i' } })
}

exports.findBook = (isbn13) => {
    return db.collection('booklist').find({ 'ISBNs.ISBN13': isbn13 }).count()
}

exports.addBook = (json) => {
  db.collection('booklist').insert(json)
};

exports.updateBook = (book) => {
    db.collection('booklist').replaceOne({ 'ISBNs.ISBN13': book.ISBNs.ISBN13 }, book)
}

exports.findUser = (username) => {
    return db.collection('users').find({ 'username': username })
}

exports.registerUser = (user) => {
    db.collection('users').insert(user)
}

exports.getUser = (username) => {
    return db.collection('users').find({ 'username': username.toLowerCase() })
}

exports.updateUser = (username,data) => {
    return db.collection('users').updateOne({'username': username}, 
    {$set : {'name': data.name, 'password': data.password, 'email': data.email, 'favourites': data.favourites}})
}