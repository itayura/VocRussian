const fs = require('fs');
const path = require('path');

const placementPath = path.join(__dirname, '..', 'js', 'placement.js');
const content = fs.readFileSync(placementPath, 'utf8');

// Find the start and end of PLACEMENT_QUESTIONS array
const startIdx = content.indexOf('const PLACEMENT_QUESTIONS = [');
if (startIdx === -1) {
  console.error('Could not find PLACEMENT_QUESTIONS array');
  process.exit(1);
}

const endIdx = content.indexOf('];', startIdx);
const arrayStr = content.substring(startIdx + 'const PLACEMENT_QUESTIONS = '.length, endIdx + 1);

// Safely evaluate the array string to turn it into a JavaScript object
const questions = eval(arrayStr);

// Apply B1 Question 28 hotfix so it's correct in the JSON
for (let q of questions) {
  if (q.id === 28) {
    q.choices = ["старше", "более старый", "самый старый", "старее"];
    q.answer = "старше";
  }
}

const outputPath = path.join(__dirname, '..', 'placement_questions.json');
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('Successfully extracted questions to placement_questions.json');
