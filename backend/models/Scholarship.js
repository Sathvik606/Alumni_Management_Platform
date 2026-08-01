const mongoose = require('mongoose');

const ScholarshipSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alumni',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    amountNeeded: {
      type: Number,
      required: true,
      min: 1,
    },
    amountRaised: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'funded', 'closed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scholarship', ScholarshipSchema);
