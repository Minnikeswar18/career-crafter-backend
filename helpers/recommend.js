const nlp = require('compromise');
const sw = require('stopword');

const extractTags = async(text , skills) => {
    text = text.toLowerCase();
    const doc = await nlp(text);
    const nouns = sw.removeStopwords(await doc.nouns().out('array').flatMap(term => term.split(' ')));
    const adjectives = sw.removeStopwords(await doc.adjectives().out('array').flatMap(term => term.split(' ')));
    const result = new Set([...nouns, ...adjectives , ...skills]);
    return result;
}

const calculateJaccardSimilarity = (jobSkills, userSkills) => {
    const jobSkillsArray = Array.from(jobSkills);
    const userSkillsArray = Array.from(userSkills);

    const intersection = jobSkillsArray.filter(skill => userSkills.has(skill)).length;
    const union = jobSkillsArray.length + userSkillsArray.length - intersection;

    const similarity = (intersection / union) * 100;
    return similarity;
}

const assignScores = async(profiles , job) => {
    if(profiles.length === 0 || !job){
        return [];
    }
    const jobTags = await extractTags(job.jobDescription + " " + job.jobTitle , job.jobSkills);
    const result = [];
    for(const profile of profiles){
        const profileTags = await extractTags(profile.userBio + " " + profile.userAbout, profile.userSkills);
        const score = calculateJaccardSimilarity(jobTags , profileTags);
        const data = {...profile._doc , score};
        result.push(data);
    }
    result.sort((a , b) => b.score - a.score);
    const top5Profiles = result.slice(0 , Math.min(5 , result.length));
    return top5Profiles;
}

module.exports = assignScores;
