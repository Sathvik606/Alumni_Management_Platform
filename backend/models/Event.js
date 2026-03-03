const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    location: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      default: 'offline',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alumni',
      required: true,
    },
    maxAttendees: {
      type: Number,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumni',
      },
    ],
    guests: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
        },
        name: {
          type: String,
        },
        profilePicture: {
          type: String,
        },
        alumniId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Alumni',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', EventSchema);
