import mongoose from 'mongoose'

// this is how we define data we will insert into the database
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  businessName: {
    type: String,
    required: true
  },
  abn: {
    type: String,
    required: true
  },
  tokens: {
    type: [String],
    default: []
  }
}, {timestamps: true})
// timestamps keeps track of when it was created or updated

export default mongoose.model('User', userSchema)