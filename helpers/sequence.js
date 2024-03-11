const Sequence = require('../db/models/jobSequence/model');

async function getNextSequenceValue(sequenceName) {
  const sequence = await Sequence.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  if(!sequence){
    const newSequence = new Sequence({name: sequenceName, value: 1});
    await newSequence.save();
    return newSequence.value;
  }
  
  return sequence.value;
}

module.exports = getNextSequenceValue;
