/**
 * Full runnable solutions for curated code practice questions.
 * Used by the typing Q&A builder — not fragments, complete functions.
 */

function jsValue(value) {
  return JSON.stringify(value, null, 2);
}

function wrapSolution(functionName, sampleInput, body) {
  return `${body.trim()}

const sampleInput = ${jsValue(sampleInput)};
return ${functionName}(sampleInput);`;
}

const PRIME = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i += 1) if (n % i === 0) return false;
  return true;
};

const BODIES = {
  findLargest: `function findLargest(input) {
  return Math.max(...input);
}`,
  findSecondLargest: `function findSecondLargest(input) {
  const unique = [...new Set(input)].sort((a, b) => b - a);
  return unique[1];
}`,
  findSecondSmallest: `function findSecondSmallest(input) {
  const unique = [...new Set(input)].sort((a, b) => a - b);
  return unique[1];
}`,
  sumSecondLargestSmallest: `function sumSecondLargestSmallest(input) {
  const unique = [...new Set(input)].sort((a, b) => a - b);
  return unique[1] + unique[unique.length - 2];
}`,
  highestEven: `function highestEven(input) {
  const evens = input.filter((n) => n % 2 === 0);
  return evens.length ? Math.max(...evens) : undefined;
}`,
  highestOdd: `function highestOdd(input) {
  const odds = input.filter((n) => n % 2 !== 0);
  return odds.length ? Math.max(...odds) : undefined;
}`,
  largestOddUsingReduce: `function largestOddUsingReduce(input) {
  return input.filter((n) => n % 2 !== 0).reduce((max, n) => (n > max ? n : max), -Infinity);
}`,
  missingNumber: `function missingNumber(input) {
  const { nums, n } = input;
  const expected = (n * (n + 1)) / 2;
  const actual = nums.reduce((sum, num) => sum + num, 0);
  return expected - actual;
}`,
  returnNthElement: `function returnNthElement(input) {
  return input.nums[input.index];
}`,
  hasAllElements: `function hasAllElements(input) {
  return input.required.every((value) => input.nums.includes(value));
}`,
  searchTwoElements: `function searchTwoElements(input) {
  return input.nums.includes(input.first) && input.nums.includes(input.second);
}`,
  sumArray: `function sumArray(input) {
  return input.reduce((sum, n) => sum + n, 0);
}`,
  sumUsingReduce: `function sumUsingReduce(input) {
  return input.reduce((sum, n) => sum + n, 0);
}`,
  sumUsingForEach: `function sumUsingForEach(input) {
  let total = 0;
  input.forEach((n) => { total += n; });
  return total;
}`,
  sumUsingArrow: `function sumUsingArrow(input) {
  return input.reduce((sum, n) => sum + n, 0);
}`,
  sumEvenNumbers: `function sumEvenNumbers(input) {
  return input.filter((n) => n % 2 === 0).reduce((sum, n) => sum + n, 0);
}`,
  sumPositiveNumbers: `function sumPositiveNumbers(input) {
  return input.filter((n) => n > 0).reduce((sum, n) => sum + n, 0);
}`,
  sumPrimeNumbers: `function sumPrimeNumbers(input) {
  const isPrime = (n) => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i += 1) if (n % i === 0) return false;
    return true;
  };
  return input.filter(isPrime).reduce((sum, n) => sum + n, 0);
}`,
  sumPositiveValues: `function sumPositiveValues(input) {
  return input.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
}`,
  countOccurrences: `function countOccurrences(input) {
  return input.reduce((freq, value) => {
    freq[value] = (freq[value] || 0) + 1;
    return freq;
  }, {});
}`,
  mostFrequentElement: `function mostFrequentElement(input) {
  const freq = countOccurrences(input);
  return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
}`,
  leastFrequentElement: `function leastFrequentElement(input) {
  const freq = countOccurrences(input);
  return Number(Object.entries(freq).sort((a, b) => a[1] - b[1])[0][0]);
}`,
  secondMostFrequentElement: `function secondMostFrequentElement(input) {
  const freq = countOccurrences(input);
  return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[1][0]);
}`,
  duplicateElements: `function duplicateElements(input) {
  const seen = new Set();
  const dup = new Set();
  input.forEach((value) => {
    if (seen.has(value)) dup.add(value);
    seen.add(value);
  });
  return [...dup];
}`,
  uniqueElements: `function uniqueElements(input) {
  const freq = countOccurrences(input);
  return input.filter((value, index) => freq[value] === 1 && input.indexOf(value) === index);
}`,
  firstRepeatingElement: `function firstRepeatingElement(input) {
  const seen = new Set();
  for (const value of input) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return undefined;
}`,
  firstNonRepeatingElement: `function firstNonRepeatingElement(input) {
  const freq = countOccurrences(input);
  return input.find((value) => freq[value] === 1);
}`,
  occurringExactlyTwice: `function occurringExactlyTwice(input) {
  const freq = countOccurrences(input);
  return [...new Set(input.filter((value) => freq[value] === 2))];
}`,
  occurringMoreThanK: `function occurringMoreThanK(input) {
  const freq = countOccurrences(input.nums);
  return [...new Set(input.nums.filter((value) => freq[value] > input.k))];
}`,
  removeDuplicates: `function removeDuplicates(input) {
  return [...new Set(input)];
}`,
  removeDuplicateEvenNumbers: `function removeDuplicateEvenNumbers(input) {
  const seenEven = new Set();
  return input.filter((n) => {
    if (n % 2 !== 0) return true;
    if (seenEven.has(n)) return false;
    seenEven.add(n);
    return true;
  });
}`,
  removeEvenNumbers: `function removeEvenNumbers(input) {
  return input.filter((n) => n % 2 !== 0);
}`,
  removeOddNumbers: `function removeOddNumbers(input) {
  return input.filter((n) => n % 2 === 0);
}`,
  removeConsecutiveOddNumbers: `function removeConsecutiveOddNumbers(input) {
  return input.filter((n, index) => {
    if (n % 2 === 0) return true;
    const prevOdd = index > 0 && input[index - 1] % 2 !== 0;
    const nextOdd = index < input.length - 1 && input[index + 1] % 2 !== 0;
    return !(prevOdd || nextOdd);
  });
}`,
  removeMultiplesOfThree: `function removeMultiplesOfThree(input) {
  return input.filter((n) => n % 3 !== 0);
}`,
  removePrimeNumbers: `function removePrimeNumbers(input) {
  const isPrime = (n) => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i += 1) if (n % i === 0) return false;
    return true;
  };
  return input.filter((n) => !isPrime(n));
}`,
  removeSmallestElement: `function removeSmallestElement(input) {
  const min = Math.min(...input);
  const index = input.indexOf(min);
  return input.filter((_, i) => i !== index);
}`,
  removeFalsyValues: `function removeFalsyValues(input) {
  return input.filter(Boolean);
}`,
  removeZeros: `function removeZeros(input) {
  return input.filter((n) => n !== 0);
}`,
  removeNegativeNumbers: `function removeNegativeNumbers(input) {
  return input.filter((n) => n >= 0);
}`,
  removeGreaterThanX: `function removeGreaterThanX(input) {
  return input.nums.filter((n) => n <= input.x);
}`,
  removeElementsFromAnotherArray: `function removeElementsFromAnotherArray(input) {
  const remove = new Set(input.remove);
  return input.nums.filter((n) => !remove.has(n));
}`,
  insertAtIndex: `function insertAtIndex(input) {
  const result = [...input.nums];
  result.splice(input.index, 0, input.value);
  return result;
}`,
  insertIntoSortedArray: `function insertIntoSortedArray(input) {
  const result = [...input.nums, input.value].sort((a, b) => a - b);
  return result;
}`,
  insertBeforeElement: `function insertBeforeElement(input) {
  const index = input.nums.indexOf(input.target);
  const result = [...input.nums];
  result.splice(index, 0, input.value);
  return result;
}`,
  insertAfterElement: `function insertAfterElement(input) {
  const index = input.nums.indexOf(input.target);
  const result = [...input.nums];
  result.splice(index + 1, 0, input.value);
  return result;
}`,
  deleteByValue: `function deleteByValue(input) {
  return input.nums.filter((n) => n !== input.value);
}`,
  deleteFirstOccurrence: `function deleteFirstOccurrence(input) {
  const index = input.nums.indexOf(input.value);
  return input.nums.filter((_, i) => i !== index);
}`,
  deleteNthOccurrence: `function deleteNthOccurrence(input) {
  let count = 0;
  return input.nums.filter((value) => {
    if (value !== input.value) return true;
    count += 1;
    return count !== input.occurrence;
  });
}`,
  deleteAllOccurrences: `function deleteAllOccurrences(input) {
  return input.nums.filter((n) => n !== input.value);
}`,
  deleteLastElement: `function deleteLastElement(input) {
  return input.slice(0, -1);
}`,
  deleteSecondLastElement: `function deleteSecondLastElement(input) {
  const result = [...input];
  result.splice(result.length - 2, 1);
  return result;
}`,
  reverseArray: `function reverseArray(input) {
  return [...input].reverse();
}`,
  reverseInPlace: `function reverseInPlace(input) {
  return [...input].reverse();
}`,
  rotateLeft: `function rotateLeft(input) {
  return [...input.slice(1), input[0]];
}`,
  rotateRight: `function rotateRight(input) {
  return [input[input.length - 1], ...input.slice(0, -1)];
}`,
  rotateByK: `function rotateByK(input) {
  const { nums, k } = input;
  const size = nums.length;
  const shift = k % size;
  return [...nums.slice(size - shift), ...nums.slice(0, size - shift)];
}`,
  moveZerosToEnd: `function moveZerosToEnd(input) {
  const nonZero = input.filter((n) => n !== 0);
  const zeros = input.filter((n) => n === 0);
  return [...nonZero, ...zeros];
}`,
  moveZerosToBeginning: `function moveZerosToBeginning(input) {
  const nonZero = input.filter((n) => n !== 0);
  const zeros = input.filter((n) => n === 0);
  return [...zeros, ...nonZero];
}`,
  moveNegativesToFront: `function moveNegativesToFront(input) {
  const negatives = input.filter((n) => n < 0);
  const others = input.filter((n) => n >= 0);
  return [...negatives, ...others];
}`,
  alternatePositiveNegative: `function alternatePositiveNegative(input) {
  const positives = input.filter((n) => n > 0);
  const negatives = input.filter((n) => n < 0);
  const result = [];
  while (positives.length || negatives.length) {
    if (positives.length) result.push(positives.shift());
    if (negatives.length) result.push(negatives.shift());
  }
  return result;
}`,
  alternateEvenOdd: `function alternateEvenOdd(input) {
  const evens = input.filter((n) => n % 2 === 0);
  const odds = input.filter((n) => n % 2 !== 0);
  const result = [];
  while (evens.length || odds.length) {
    if (evens.length) result.push(evens.shift());
    if (odds.length) result.push(odds.shift());
  }
  return result;
}`,
  separateEvenOdd: `function separateEvenOdd(input) {
  return [...input.filter((n) => n % 2 === 0), ...input.filter((n) => n % 2 !== 0)];
}`,
  pairSumClosestToZero: `function pairSumClosestToZero(input) {
  let left = 0;
  let right = input.length - 1;
  let bestPair = [input[left], input[right]];
  let bestDiff = Math.abs(input[left] + input[right]);
  while (left < right) {
    const sum = input[left] + input[right];
    const diff = Math.abs(sum);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestPair = [input[left], input[right]];
    }
    if (sum < 0) left += 1;
    else right -= 1;
  }
  return bestPair;
}`,
  pairWithGivenSum: `function pairWithGivenSum(input) {
  const map = new Map();
  for (const num of input.nums) {
    const need = input.target - num;
    if (map.has(need)) return [need, num];
    map.set(num, true);
  }
  return null;
}`,
  pairWithGivenDifference: `function pairWithGivenDifference(input) {
  const set = new Set(input.nums);
  for (const num of input.nums) {
    if (set.has(num + input.diff)) return [num, num + input.diff];
  }
  return null;
}`,
  tripletsWithGivenSum: `function tripletsWithGivenSum(input) {
  const nums = [...input.nums].sort((a, b) => a - b);
  for (let i = 0; i < nums.length - 2; i += 1) {
    let left = i + 1;
    let right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === input.target) return [nums[i], nums[left], nums[right]];
      if (sum < input.target) left += 1;
      else right -= 1;
    }
  }
  return null;
}`,
  duplicatePairs: `function duplicatePairs(input) {
  const seen = new Map();
  const result = [];
  for (const pair of input) {
    const key = JSON.stringify(pair);
    seen.set(key, (seen.get(key) || 0) + 1);
    if (seen.get(key) === 2) result.push(pair);
  }
  return result;
}`,
  mergeArrays: `function mergeArrays(input) {
  return [...input.first, ...input.second];
}`,
  mergeWithoutDuplicates: `function mergeWithoutDuplicates(input) {
  return [...new Set([...input.first, ...input.second])];
}`,
  flattenNestedArrays: `function flattenNestedArrays(input) {
  return input.flat(Infinity);
}`,
  chunkArray: `function chunkArray(input) {
  const result = [];
  for (let i = 0; i < input.nums.length; i += input.size) {
    result.push(input.nums.slice(i, i + input.size));
  }
  return result;
}`,
  shuffleArray: `function shuffleArray(input) {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}`,
  sortWithoutSort: `function sortWithoutSort(input) {
  const result = [...input];
  for (let i = 0; i < result.length; i += 1) {
    for (let j = i + 1; j < result.length; j += 1) {
      if (result[j] < result[i]) [result[i], result[j]] = [result[j], result[i]];
    }
  }
  return result;
}`,
  sortObjectsByAge: `function sortObjectsByAge(input) {
  return [...input].sort((a, b) => a.age - b.age);
}`,
  equilibriumIndex: `function equilibriumIndex(input) {
  const total = input.reduce((sum, n) => sum + n, 0);
  let left = 0;
  for (let i = 0; i < input.length; i += 1) {
    if (left === total - left - input[i]) return i;
    left += input[i];
  }
  return -1;
}`,
  leadersInArray: `function leadersInArray(input) {
  const result = [];
  let maxRight = -Infinity;
  for (let i = input.length - 1; i >= 0; i -= 1) {
    if (input[i] >= maxRight) {
      result.unshift(input[i]);
      maxRight = input[i];
    }
  }
  return result;
}`,
  majorityElement: `function majorityElement(input) {
  const freq = countOccurrences(input);
  const threshold = input.length / 2;
  return Number(Object.entries(freq).find(([, count]) => count > threshold)[0]);
}`,
  fizzBuzz: `function fizzBuzz(input) {
  const result = [];
  for (let i = 1; i <= input; i += 1) {
    if (i % 15 === 0) result.push('FizzBuzz');
    else if (i % 3 === 0) result.push('Fizz');
    else if (i % 5 === 0) result.push('Buzz');
    else result.push(i);
  }
  return result;
}`,
  swapElements: `function swapElements(input) {
  const result = [...input.nums];
  [result[input.i], result[input.j]] = [result[input.j], result[input.i]];
  return result;
}`,
  stringArrayToObject: `function stringArrayToObject(input) {
  return input.reduce((obj, key) => ({ ...obj, [key]: true }), {});
}`,
  titleCaseArray: `function titleCaseArray(input) {
  return input.map((text) => text.replace(/\\b\\w/g, (char) => char.toUpperCase()));
}`,
  printPattern: `function printPattern(input) {
  return Array.from({ length: input }, (_, i) => '*'.repeat(i + 1));
}`,
  removeVowels: `function removeVowels(input) {
  return input.replace(/[aeiou]/gi, '');
}`,
  removeConsonants: `function removeConsonants(input) {
  return input.replace(/[^aeiou\\s]/gi, '');
}`,
  removeDuplicateCharacters: `function removeDuplicateCharacters(input) {
  const seen = new Set();
  return [...input].filter((char) => {
    if (seen.has(char)) return false;
    seen.add(char);
    return true;
  }).join('');
}`,
  removeDuplicateWords: `function removeDuplicateWords(input) {
  const seen = new Set();
  return input.split(' ').filter((word) => {
    if (seen.has(word)) return false;
    seen.add(word);
    return true;
  }).join(' ');
}`,
  removeSpecialCharacters: `function removeSpecialCharacters(input) {
  return input.replace(/[^a-zA-Z0-9\\s]/g, '');
}`,
  removeDigits: `function removeDigits(input) {
  return input.replace(/\\d/g, '');
}`,
  keepOnlyDigits: `function keepOnlyDigits(input) {
  return input.replace(/\\D/g, '');
}`,
  removeWhitespaces: `function removeWhitespaces(input) {
  return input.replace(/\\s/g, '');
}`,
  removeSpecificCharacter: `function removeSpecificCharacter(input) {
  return input.text.split(input.char).join('');
}`,
  reverseString: `function reverseString(input) {
  return [...input].reverse().join('');
}`,
  reverseWithoutBuiltIns: `function reverseWithoutBuiltIns(input) {
  let reversed = '';
  for (let i = input.length - 1; i >= 0; i -= 1) reversed += input[i];
  return reversed;
}`,
  reverseUsingPrototype: `function reverseUsingPrototype(input) {
  return [...input].reverse().join('');
}`,
  reverseWordOrder: `function reverseWordOrder(input) {
  return input.split(' ').reverse().join(' ');
}`,
  reverseAlternateWords: `function reverseAlternateWords(input) {
  return input.split(' ').map((word, index) => (index % 2 === 1 ? [...word].reverse().join('') : word)).join(' ');
}`,
  reverseVowels: `function reverseVowels(input) {
  const vowels = input.match(/[aeiou]/gi) || [];
  return input.replace(/[aeiou]/gi, () => vowels.pop());
}`,
  reverseConsonants: `function reverseConsonants(input) {
  const consonants = input.match(/[^aeiou\\s]/gi) || [];
  return input.replace(/[^aeiou\\s]/gi, () => consonants.pop());
}`,
  reverseEachWord: `function reverseEachWord(input) {
  return input.split(' ').map((word) => [...word].reverse().join('')).join(' ');
}`,
  reverseEachWordLetters: `function reverseEachWordLetters(input) {
  return input.split(' ').map((word) => [...word].reverse().join('')).join(' ');
}`,
  capitalizeFirstLetter: `function capitalizeFirstLetter(input) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}`,
  capitalizeLastLetter: `function capitalizeLastLetter(input) {
  return input.slice(0, -1) + input.slice(-1).toUpperCase();
}`,
  capitalizeEveryWord: `function capitalizeEveryWord(input) {
  return input.replace(/\\b\\w/g, (char) => char.toUpperCase());
}`,
  toggleCase: `function toggleCase(input) {
  return [...input].map((char) => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase())).join('');
}`,
  upperToLowerWithoutBuiltIns: `function upperToLowerWithoutBuiltIns(input) {
  return [...input].map((char) => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(code + 32);
    return char;
  }).join('');
}`,
  countVowels: `function countVowels(input) {
  return (input.match(/[aeiou]/gi) || []).length;
}`,
  countConsonants: `function countConsonants(input) {
  return (input.match(/[^aeiou\\s]/gi) || []).length;
}`,
  countWords: `function countWords(input) {
  return input.trim().split(/\\s+/).length;
}`,
  wordFrequency: `function wordFrequency(input) {
  return input.split(' ').reduce((freq, word) => {
    freq[word] = (freq[word] || 0) + 1;
    return freq;
  }, {});
}`,
  upperLowerCount: `function upperLowerCount(input) {
  return {
    uppercase: (input.match(/[A-Z]/g) || []).length,
    lowercase: (input.match(/[a-z]/g) || []).length,
  };
}`,
  uniqueCharacters: `function uniqueCharacters(input) {
  const freq = countOccurrences([...input]);
  return [...input].filter((char, index) => freq[char] === 1 && input.indexOf(char) === index);
}`,
  firstNonRepeatingChar: `function firstNonRepeatingChar(input) {
  const freq = countOccurrences([...input]);
  return [...input].find((char) => freq[char] === 1);
}`,
  firstRepeatingChar: `function firstRepeatingChar(input) {
  const seen = new Set();
  for (const char of input) {
    if (seen.has(char)) return char;
    seen.add(char);
  }
  return undefined;
}`,
  lastNonRepeatingChar: `function lastNonRepeatingChar(input) {
  const freq = countOccurrences([...input]);
  return [...input].reverse().find((char) => freq[char] === 1);
}`,
  lastRepeatingChar: `function lastRepeatingChar(input) {
  const seen = new Set();
  let last = undefined;
  for (const char of input) {
    if (seen.has(char)) last = char;
    seen.add(char);
  }
  return last;
}`,
  longestWord: `function longestWord(input) {
  return input.split(' ').reduce((longest, word) => (word.length > longest.length ? word : longest), '');
}`,
  shortestWord: `function shortestWord(input) {
  return input.split(' ').reduce((shortest, word) => (word.length < shortest.length ? word : shortest), input.split(' ')[0]);
}`,
  longestConsecutiveCharacters: `function longestConsecutiveCharacters(input) {
  let best = '';
  let current = '';
  for (const char of input) {
    if (!current || char === current.at(-1)) current += char;
    else current = char;
    if (current.length > best.length) best = current;
  }
  return best;
}`,
  findExtraCharacters: `function findExtraCharacters(input) {
  const first = new Set(input.first);
  return [...new Set(input.second)].filter((char) => !first.has(char));
}`,
  isAnagram: `function isAnagram(input) {
  const normalize = (value) => value.split('').sort().join('');
  return normalize(input.first) === normalize(input.second);
}`,
  sortCharactersAlphabetically: `function sortCharactersAlphabetically(input) {
  return [...input].sort().join('');
}`,
  missingLetter: `function missingLetter(input) {
  for (let i = 0; i < input.length - 1; i += 1) {
    if (input.charCodeAt(i + 1) - input.charCodeAt(i) > 1) {
      return String.fromCharCode(input.charCodeAt(i) + 1);
    }
  }
  return undefined;
}`,
  titleCaseConversion: `function titleCaseConversion(input) {
  return input.replace(/\\b\\w/g, (char) => char.toUpperCase());
}`,
  isPrime: `function isPrime(input) {
  if (input < 2) return false;
  for (let i = 2; i * i <= input; i += 1) if (input % i === 0) return false;
  return true;
}`,
  primesUpToN: `function primesUpToN(input) {
  const isPrime = (n) => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i += 1) if (n % i === 0) return false;
    return true;
  };
  return Array.from({ length: input }, (_, i) => i + 1).filter(isPrime);
}`,
  countPrimesInArray: `function countPrimesInArray(input) {
  return input.filter(isPrime).length;
}`,
  replacePrimesWithZero: `function replacePrimesWithZero(input) {
  return input.map((n) => (isPrime(n) ? 0 : n));
}`,
  largestPrime: `function largestPrime(input) {
  return Math.max(...input.filter(isPrime));
}`,
  smallestPrime: `function smallestPrime(input) {
  return Math.min(...input.filter(isPrime));
}`,
  nthPrime: `function nthPrime(input) {
  const primes = [];
  for (let n = 2; primes.length < input; n += 1) if (isPrime(n)) primes.push(n);
  return primes[input - 1];
}`,
  everyElementPrime: `function everyElementPrime(input) {
  return input.every(isPrime);
}`,
  isStringPalindrome: `function isStringPalindrome(input) {
  const normalized = input.toLowerCase();
  return normalized === [...normalized].reverse().join('');
}`,
  isNumberPalindrome: `function isNumberPalindrome(input) {
  const text = String(input);
  return text === [...text].reverse().join('');
}`,
  recursivePalindrome: `function recursivePalindrome(input) {
  if (input.length <= 1) return true;
  if (input[0] !== input.at(-1)) return false;
  return recursivePalindrome(input.slice(1, -1));
}`,
  findPalindromes: `function findPalindromes(input) {
  return input.filter(isStringPalindrome);
}`,
  countPalindromeWords: `function countPalindromeWords(input) {
  return input.split(' ').filter(isStringPalindrome).length;
}`,
  removePalindromeStrings: `function removePalindromeStrings(input) {
  return input.filter((word) => !isStringPalindrome(word));
}`,
  longestPalindromeWord: `function longestPalindromeWord(input) {
  return input.split(' ').filter(isStringPalindrome).reduce((best, word) => (word.length > best.length ? word : best), '');
}`,
  reverseNumber: `function reverseNumber(input) {
  return Number([...String(input)].reverse().join(''));
}`,
  sumOfDigits: `function sumOfDigits(input) {
  return [...String(input)].reduce((sum, digit) => sum + Number(digit), 0);
}`,
  productOfDigits: `function productOfDigits(input) {
  return [...String(input)].reduce((product, digit) => product * Number(digit), 1);
}`,
  countDigits: `function countDigits(input) {
  return String(input).length;
}`,
  largestDigit: `function largestDigit(input) {
  return Math.max(...[...String(input)].map(Number));
}`,
  smallestDigit: `function smallestDigit(input) {
  return Math.min(...[...String(input)].map(Number));
}`,
  evenOrOdd: `function evenOrOdd(input) {
  return input % 2 === 0 ? 'even' : 'odd';
}`,
  positiveNegativeZero: `function positiveNegativeZero(input) {
  if (input > 0) return 'positive';
  if (input < 0) return 'negative';
  return 'zero';
}`,
  isArmstrong: `function isArmstrong(input) {
  const digits = [...String(input)];
  const power = digits.length;
  const sum = digits.reduce((total, digit) => total + Number(digit) ** power, 0);
  return sum === input;
}`,
  isPerfect: `function isPerfect(input) {
  let sum = 0;
  for (let i = 1; i <= input / 2; i += 1) if (input % i === 0) sum += i;
  return sum === input;
}`,
  isStrong: `function isStrong(input) {
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
  const sum = [...String(input)].reduce((total, digit) => total + factorial(Number(digit)), 0);
  return sum === input;
}`,
  isHarshad: `function isHarshad(input) {
  const sum = sumOfDigits(input);
  return input % sum === 0;
}`,
  isNeon: `function isNeon(input) {
  const squared = input * input;
  return sumOfDigits(squared) === input;
}`,
  isSpy: `function isSpy(input) {
  const digits = [...String(input)].map(Number);
  const sum = digits.reduce((total, digit) => total + digit, 0);
  const product = digits.reduce((total, digit) => total * digit, 1);
  return sum === product;
}`,
  isAutomorphic: `function isAutomorphic(input) {
  const squared = String(input * input);
  return squared.endsWith(String(input));
}`,
  isHappy: `function isHappy(input) {
  const seen = new Set();
  let current = input;
  while (current !== 1 && !seen.has(current)) {
    seen.add(current);
    current = sumOfDigits(current);
  }
  return current === 1;
}`,
  isDuck: `function isDuck(input) {
  const text = String(input);
  return text.includes('0') && !text.startsWith('0');
}`,
  isDisarium: `function isDisarium(input) {
  const digits = [...String(input)];
  const sum = digits.reduce((total, digit, index) => total + Number(digit) ** (index + 1), 0);
  return sum === input;
}`,
  fibonacci: `function fibonacci(input) {
  let a = 0;
  let b = 1;
  for (let i = 0; i < input; i += 1) [a, b] = [b, a + b];
  return a;
}`,
  factorial: `function factorial(input) {
  let result = 1;
  for (let i = 2; i <= input; i += 1) result *= i;
  return result;
}`,
  gcd: `function gcd(input) {
  let a = input.a;
  let b = input.b;
  while (b) [a, b] = [b, a % b];
  return a;
}`,
  lcm: `function lcm(input) {
  const gcdValue = gcd(input);
  return Math.abs(input.a * input.b) / gcdValue;
}`,
  swapWithoutThirdVariable: `function swapWithoutThirdVariable(input) {
  return { a: input.b, b: input.a };
}`,
  isEmptyObject: `function isEmptyObject(input) {
  return Object.keys(input).length === 0;
}`,
  deleteProperty: `function deleteProperty(input) {
  const result = { ...input.obj };
  delete result[input.key];
  return result;
}`,
  addProperty: `function addProperty(input) {
  return { ...input.obj, [input.key]: input.value };
}`,
  mergeObjects: `function mergeObjects(input) {
  return { ...input.first, ...input.second };
}`,
  sumObjectValues: `function sumObjectValues(input) {
  return Object.values(input).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
}`,
  iterateObject: `function iterateObject(input) {
  return Object.entries(input);
}`,
  deepCopyObject: `function deepCopyObject(input) {
  return structuredClone(input);
}`,
  shallowCopyObject: `function shallowCopyObject(input) {
  return { ...input };
}`,
  freezeObject: `function freezeObject(input) {
  return Object.isFrozen(Object.freeze({ ...input }));
}`,
  nestedDestructuring: `function nestedDestructuring(input) {
  const { user: { address: { city } } } = input;
  return city;
}`,
  objectDestructuring: `function objectDestructuring(input) {
  const { name, age } = input;
  return { name, age };
}`,
  prototypeChaining: `function prototypeChaining(input) {
  const child = Object.create(input);
  return child.inherited;
}`,
  removeLastProperty: `function removeLastProperty(input) {
  const keys = Object.keys(input);
  const result = { ...input };
  delete result[keys.at(-1)];
  return result;
}`,
  removeOddValuedProperties: `function removeOddValuedProperties(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value % 2 === 0));
}`,
  highestValueKey: `function highestValueKey(input) {
  return Object.entries(input).sort((a, b) => b[1] - a[1])[0][0];
}`,
  lowestValueKey: `function lowestValueKey(input) {
  return Object.entries(input).sort((a, b) => a[1] - b[1])[0][0];
}`,
  parentObjectToArray: `function parentObjectToArray(input) {
  return Object.entries(input);
}`,
  throwErrorBasedOnDatatype: `function throwErrorBasedOnDatatype(input) {
  return typeof input === 'number' ? input : 'Invalid type: expected number';
}`,
  totalProductPrice: `function totalProductPrice(input) {
  return input.reduce((sum, item) => sum + item.price * item.qty, 0);
}`,
  studentsPerClass: `function studentsPerClass(input) {
  return input.reduce((groups, student) => {
    groups[student.class] = (groups[student.class] || 0) + 1;
    return groups;
  }, {});
}`,
  highestScore: `function highestScore(input) {
  return input.reduce((best, student) => (student.score > best.score ? student : best));
}`,
  addPassFailStatus: `function addPassFailStatus(input) {
  return input.map((student) => ({ ...student, status: student.score >= 50 ? 'pass' : 'fail' }));
}`,
  mostAgedUser: `function mostAgedUser(input) {
  return input.reduce((best, user) => (user.age > best.age ? user : best));
}`,
  averageAge: `function averageAge(input) {
  return input.reduce((sum, user) => sum + user.age, 0) / input.length;
}`,
  removeDuplicateObjects: `function removeDuplicateObjects(input) {
  const seen = new Set();
  return input.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}`,
  groupByProperty: `function groupByProperty(input) {
  return input.items.reduce((groups, item) => {
    const key = item[input.key];
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}`,
  countByCategory: `function countByCategory(input) {
  return input.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
}`,
  renameKeys: `function renameKeys(input) {
  return Object.entries(input.obj).reduce((result, [key, value]) => {
    result[input.map[key] || key] = value;
    return result;
  }, {});
}`,
  removeNullUndefined: `function removeNullUndefined(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value != null));
}`,
  sortByAge: `function sortByAge(input) {
  return [...input].sort((a, b) => a.age - b.age);
}`,
  arrowFunction: `function arrowFunction(input) {
  const sum = (a, b) => a + b;
  return sum(input.a, input.b);
}`,
  restParameters: `function restParameters(input) {
  const sum = (...nums) => nums.reduce((total, n) => total + n, 0);
  return sum(...input);
}`,
  higherOrderFunction: `function higherOrderFunction(input) {
  const apply = (nums, operation) => nums.map((n) => (operation === 'double' ? n * 2 : n));
  return apply(input.nums, input.operation);
}`,
  curriedAddition: `function curriedAddition(input) {
  const add = (a) => (b) => (c) => a + b + c;
  return add(input.a)(input.b)(input.c);
}`,
  functionBorrowing: `function functionBorrowing(input) {
  const fullName = function () {
    return \`\${this.firstName} \${this.lastName}\`;
  };
  return fullName.call(input);
}`,
  factoryFunction: `function factoryFunction(input) {
  const createUser = (name, role) => ({ name, role });
  return createUser(input.name, input.role);
}`,
  generatorSequence: `function generatorSequence(input) {
  function* sequence() {
    let current = 1;
    while (true) yield current++;
  }
  const gen = sequence();
  return Array.from({ length: input }, () => gen.next().value);
}`,
  pureFunction: `function pureFunction(input) {
  return input.map((n) => n * 2);
}`,
  recursiveSum: `function recursiveSum(input) {
  if (input <= 0) return 0;
  return input + recursiveSum(input - 1);
}`,
  recursiveFactorial: `function recursiveFactorial(input) {
  if (input <= 1) return 1;
  return input * recursiveFactorial(input - 1);
}`,
  recursiveFibonacci: `function recursiveFibonacci(input) {
  if (input <= 1) return input;
  return recursiveFibonacci(input - 1) + recursiveFibonacci(input - 2);
}`,
  sumFirstFiveMultiplesOfThree: `function sumFirstFiveMultiplesOfThree() {
  let total = 0;
  let count = 0;
  for (let n = 3; count < 5; n += 3) {
    total += n;
    count += 1;
  }
  return total;
}`,
  printOneToTen: `function printOneToTen() {
  return Array.from({ length: 10 }, (_, i) => i + 1);
}`,
  printOneToTenWithDelay: `function printOneToTenWithDelay() {
  return Array.from({ length: 10 }, (_, i) => i + 1);
}`,
  countdownTimer: `function countdownTimer(input) {
  return Array.from({ length: input + 1 }, (_, i) => input - i);
}`,
  evenNumbersTwentyToTwo: `function evenNumbersTwentyToTwo() {
  const result = [];
  for (let n = 20; n >= 2; n -= 2) result.push(n);
  return result;
}`,
  reverseMultiplesOfFive: `function reverseMultiplesOfFive(input) {
  const result = [];
  for (let n = input; n >= 5; n -= 5) result.push(n);
  return result;
}`,
  evenOddCheck: `function evenOddCheck(input) {
  return input % 2 === 0 ? 'even' : 'odd';
}`,
  maximumOfTwoNumbers: `function maximumOfTwoNumbers(input) {
  return Math.max(input.a, input.b);
}`,
};

function countOccurrences(values) {
  return values.reduce((freq, value) => {
    freq[value] = (freq[value] || 0) + 1;
    return freq;
  }, {});
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i += 1) if (n % i === 0) return false;
  return true;
}

function isStringPalindrome(value) {
  const normalized = String(value).toLowerCase();
  return normalized === [...normalized].reverse().join('');
}

function sumOfDigits(value) {
  return [...String(value)].reduce((sum, digit) => sum + Number(digit), 0);
}

function gcd(input) {
  let a = input.a;
  let b = input.b;
  while (b) [a, b] = [b, a % b];
  return a;
}

function buildFullSolution(item) {
  const body = BODIES[item.functionName];
  if (!body) return null;
  return wrapSolution(item.functionName, item.sampleInput, body);
}

module.exports = {
  buildFullSolution,
  BODIES,
};
