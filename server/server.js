import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import compression from 'compression'
import dns from 'dns'

// Force Node's DNS resolver to use public servers. Without this, c-ares can fail
// the SRV lookup (`querySrv ECONNREFUSED`) on some Windows DNS configurations,
// even though the system resolver handles the same query fine.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();

import GolfRoundsCollection from './models/GolfRounds.js';
import CourseInfoCollection from './models/CourseInfo.js';

// Resolve MongoDB connection string.
// Local dev: ./uri.js (gitignored) exports `uri` as a named const.
// Production (Render): MONGO_URI is set in the service's environment dashboard.
// To switch between staging and prod locally, change the URI in uri.js;
// on Render, swap the env var.
let mongoURI;
try {
  const uriModule = await import('./uri.js');
  mongoURI = uriModule.uri ?? uriModule.default;
} catch {
  // uri.js absent — production path uses process.env directly.
}
mongoURI = mongoURI ?? process.env.MONGO_URI;
if (!mongoURI) {
  console.error('MONGO_URI is not set. Either export `uri` from ./uri.js or set MONGO_URI in process.env.');
  process.exit(1);
}

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// POST route to add a new golfRound
app.post('/add-round', async (req, res) => {
  const newRound = new GolfRoundsCollection(req.body);
  try {
    await newRound.save();
    res.json({ message: 'Round added!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET route to get all golfRounds
app.get('/golfrounds', async (req, res) => {
  try {
    const golfRounds = await GolfRoundsCollection.find();
    res.json(golfRounds);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST route to add a new courseInfo
app.post('/add-courseInfo', async (req, res) => {
    const courseInfo = new CourseInfoCollection(req.body);
    try {
      await courseInfo.save();
      res.json({ message: 'Course info added!' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

// PUT route to update an existing courseInfo by courseKey. Whitelists the fields
// the edit form is allowed to change so a stray payload can't rewrite arbitrary
// keys on the doc.
app.put('/update-courseInfo/:courseKey', async (req, res) => {
    try {
        const allowed = [
            'displayName', 'sequence', 'scoreCardHoleAbbreviation', 'flagKey',
            'f9Par', 'f9Yardage', 'b9Par', 'b9Yardage', 'par', 'yardage',
            'hole1', 'hole2', 'hole3', 'hole4', 'hole5', 'hole6', 'hole7', 'hole8', 'hole9',
            'hole10', 'hole11', 'hole12', 'hole13', 'hole14', 'hole15', 'hole16', 'hole17', 'hole18',
        ];
        const $set = {};
        const $unset = {};
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                if (req.body[key] === null || req.body[key] === undefined) {
                    $unset[key] = '';
                } else {
                    $set[key] = req.body[key];
                }
            }
        }
        const update = {};
        if (Object.keys($set).length) update.$set = $set;
        if (Object.keys($unset).length) update.$unset = $unset;
        const result = await CourseInfoCollection.findOneAndUpdate(
            { courseKey: req.params.courseKey },
            update,
            { new: true }
        );
        if (result) {
            res.json({ message: 'Course updated', course: result });
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET route to get courseInfo
app.get('/courseinfo', async(req, res) => {
  try {
    const courseInfo = await CourseInfoCollection.find();
      res.json(courseInfo);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
})

// DELETE route to remove a round by its roundInfo.key
app.delete('/round/:key', async (req, res) => {
  try {
    const result = await GolfRoundsCollection.findOneAndDelete({ "roundInfo.key": req.params.key });
    if (result) {
      res.json({ message: 'Round deleted!' });
    } else {
      res.status(404).json({ message: 'Round not found.' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/updateround', async(req, res) => {
  try {
    const result = await GolfRoundsCollection.findOneAndUpdate(
      { "roundInfo.key": req.body.roundInfo.key },
      { $set:
        {
          approach: req.body.approach,
          fairways: req.body.fairways,
          greens: req.body.greens,
          nonGhinRounds: req.body.nonGhinRounds,
          putting: req.body.putting,
          roundInfo: req.body.roundInfo,
          scoring: req.body.scoring,
          hole1: req.body.hole1,
          hole2: req.body.hole2,
          hole3: req.body.hole3,
          hole4: req.body.hole4,
          hole5: req.body.hole5,
          hole6: req.body.hole6,
          hole7: req.body.hole7,
          hole8: req.body.hole8,
          hole9: req.body.hole9,
          hole10: req.body.hole10,
          hole11: req.body.hole11,
          hole12: req.body.hole12,
          hole13: req.body.hole13,
          hole14: req.body.hole14,
          hole15: req.body.hole15,
          hole16: req.body.hole16,
          hole17: req.body.hole17,
          hole18: req.body.hole18,
          additionalHoles: req.body.additionalHoles
        }
      },
      { new: true }
    )
    if (result) {
      res.json({ message: 'Scorecard Updated!' });
    } else {
      res.json({ message: 'Existing scorecard not found.' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
