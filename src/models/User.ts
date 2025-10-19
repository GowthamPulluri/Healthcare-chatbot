import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  Diseases: string[];
  preferredLanguage: 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  Diseases: {
    type: [String],
    default: [],
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'hi', 'te', 'ta', 'kn', 'ml'],
    default: 'en',
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
