import mongoose from 'mongoose'

const courseInfoSchema = new mongoose.Schema({
  b9Par: { type: Number, required: false },
  b9Yardage: { type: Number, required: false },
  displayName: { type: String, required: false },
  courseKey: { type: String, required: false },
  f9Par: { type: Number, required: false },
  f9Yardage: { type: Number, required: false },
  par: { type: Number, required: false },
  yardage: { type: Number, required: false },
  hole1: { type: Object, required: false },
  hole2: { type: Object, required: false },
  hole3: { type: Object, required: false },
  hole4: { type: Object, required: false },
  hole5: { type: Object, required: false },
  hole6: { type: Object, required: false },
  hole7: { type: Object, required: false },
  hole8: { type: Object, required: false },
  hole9: { type: Object, required: false },
  hole10: { type: Object, required: false },
  hole11: { type: Object, required: false },
  hole12: { type: Object, required: false },
  hole13: { type: Object, required: false },
  hole14: { type: Object, required: false },
  hole15: { type: Object, required: false },
  hole16: { type: Object, required: false },
  hole17: { type: Object, required: false },
  hole18: { type: Object, required: false }
}, { minimize: false, versionKey: false });

export default mongoose.model('courseInfo', courseInfoSchema);