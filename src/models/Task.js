const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      minlength: [2, 'title must contain at least 2 characters'],
      maxlength: [120, 'title must contain at most 120 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'description must contain at most 500 characters'],
      default: ''
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('Task', taskSchema);
