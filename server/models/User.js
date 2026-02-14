import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    avatar: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          // Ensure avatar URL is a Cloudinary URL
          return /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/.+$/.test(
            v
          );
        },
        message: "Avatar must be a valid Cloudinary image URL",
      },
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    /* ================= USER ACTIVITY ================= */
    watchHistory: [
      {
        video: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Video",
          required: true,
        },
        watchedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 }, // Store progress in seconds
      },
    ],

    subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Channel" }],
    watchLater: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],

    /* ================= EMAIL VERIFICATION ================= */
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        ret.avatar = ret.avatar || "/default-avatar.png";
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpires;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ================= INDEXES ================= */
userSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
userSchema.index({ isDeleted: 1 });

/* ================= MIDDLEWARES ================= */
// Limit watch history to last 100 items
userSchema.pre("save", function (next) {
  if (this.watchHistory && this.watchHistory.length > 100) {
    this.watchHistory = this.watchHistory.slice(-100);
  }
  next();
});

// Hash password if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ================= INSTANCE METHODS ================= */
// Compare candidate password with hashed password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

/* ================= VIRTUALS ================= */
// Returns number of subscriptions
userSchema.virtual("subscriptionCount").get(function () {
  return Array.isArray(this.subscriptions) ? this.subscriptions.length : 0;
});

export default mongoose.model("User", userSchema);
