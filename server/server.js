require('./config/config')
const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')

var {ObjectID} = require('mongodb')
var {mongoose} = require('./db/mongoose')
var {Todo} = require('./models/todo')
var {User} = require('./models/user')
var {authenticate} = require('./middleware/authenticate')

var app = express()
app.use(bodyParser.json()) // third party middle ware which returns a function.

app.post('/todos',(req,res) => {
  var todo = new Todo({
    text : req.body.text
  })

  todo.save().then((doc) => {
    res.send(doc);
  },(e) => {
    console.log("Unable to save todo");
    res.status(400).send(e)
  })
})

app.get('/todos',(req,res) => {
  Todo.find().then((todos) => {
    res.send({
      todos
    })
  }, (e) => {
    res.status(400).send(e)
  })
})

app.get('/todos/:id', (req,res) => {
  var id = req.params.id
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  Todo.findById(id).then((todo) => {
    if(!todo){
      return res.status(404).send()
    }
    res.send({todo})
  }).catch((e) => {
    res.status(400).send()
  })
})

app.delete('/todos/:id', (req,res) => {
  var id = req.params.id
  if (! ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  Todo.findByIdAndRemove(id).then((todo) => {
    if (!todo) {
      return res.status(404).send()
    }
    res.send({todo})
  }).catch((e) => {
    res.status(400).send()
  })
})

app.patch('/todos/:id',(req,res) => {
  var id = req.params.id
  var body = _.pick(req.body, ['text','completed'])

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime()
  } else {
    body.completed = false
    body.completedAt = null
  }

  Todo.findByIdAndUpdate(id, {$set : body}, {new : true}).then((todo) => {
    if (!todo) {
      return res.status(404)
    }
    res.send({todo})
  }).catch((e) => {
    res.status(400).send()
  })
})

app.post('/users', (req,res) => {
  var body = _.pick(req.body,['email','password'])
  var user = new User(body)
  user.save().then(() => {
     return user.generateAuthToken()
  }).then((token) => {
    res.header('x-auth',token).send(user)
  }).catch( (e) => {
    res.status(400).send(e)
  })
})


// set private route so that user having valid token can only access it.....
app.get('/users/me',authenticate, (req,res) => {
  res.send(req.user)
})

app.listen(3000,() => {
  console.log('Listening to port 3000');
})

module.exports = {app}
