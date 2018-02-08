const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const bcrypt = require('bcryptjs')

var UserSchema = new mongoose.Schema({
  email:{
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique : true,
    validate: {
      validator: validator.isEmail,
      message: `{VALUE} is not valid.`
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
})

// Instance methods....
UserSchema.methods.toJSON = function () {
  var user = this
  var userObject = user.toObject()
  return _.pick(userObject, ['_id', 'email'])
}

UserSchema.methods.generateAuthToken = function () {
  var user = this
  var access = 'auth'
  //Generate hash token using jwt.sign(value to hash, someseceretstring).toString()
  var token = jwt.sign({_id: user._id.toHexString(),
    access}, 'SecretString').toString()
  user.tokens.push({access, token})
  return user.save().then(() => {
    return token
  })
}

// Static methods which are to be called on UserSchema not a particular instance.
UserSchema.statics.findByToken = function (token) {
  var User = this
  var decoded
  try{
    decoded = jwt.verify(token, 'SecretString')
    console.log(decoded);
  } catch(e) {
    return Promise.reject()
  }

  return User.findOne({
    '_id' : decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  })
}

//Pre & Post event middleware ....
UserSchema.pre('save', function(next) {
  var user = this
  if(user.isModified('password')){
    bcrypt.genSalt(10, (err,salt) => {
      bcrypt.hash(user.password,salt, (err,hash) => {
        user.password = hash
        next()
      })
    })
  }
  else {
    next()
  }
})

var User = mongoose.model('User', UserSchema);

//

module.exports = {User}
