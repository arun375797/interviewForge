const JS = ['javascript'];
const BOTH = ['javascript', 'dsa'];

function q(topic, title, functionName, task, sampleInput, expectedOutput, subjects = BOTH, hint = '') {
  return { topic, title, functionName, task, sampleInput, expectedOutput, subjects, hint };
}

const CODE_PRACTICE_QUESTIONS = [
  q('Searching & Finding', 'Find Largest Element', 'findLargest', 'Return the largest number in the array.', [4, 9, 2, 17, 6], 17),
  q('Searching & Finding', 'Find Second Largest', 'findSecondLargest', 'Return the second largest distinct number.', [12, 35, 1, 10, 34, 1], 34),
  q('Searching & Finding', 'Find Second Smallest', 'findSecondSmallest', 'Return the second smallest distinct number.', [12, 35, 1, 10, 34, 1], 10),
  q('Searching & Finding', 'Sum of Second Largest and Second Smallest', 'sumSecondLargestSmallest', 'Return the sum of the second largest and second smallest distinct numbers.', [12, 35, 1, 10, 34, 1], 44),
  q('Searching & Finding', 'Highest Even Number', 'highestEven', 'Return the highest even number in the array.', [7, 12, 9, 24, 15, 18], 24),
  q('Searching & Finding', 'Highest Odd Number', 'highestOdd', 'Return the highest odd number in the array.', [7, 12, 9, 24, 15, 18], 15),
  q('Searching & Finding', 'Largest Odd Using Reduce', 'largestOddUsingReduce', 'Return the largest odd number using a reduce-style approach.', [10, 15, 3, 22, 19], 19),
  q('Searching & Finding', 'Missing Number (1 to n)', 'missingNumber', 'Return the missing number from 1 to n.', { nums: [1, 2, 4, 5], n: 5 }, 3),
  q('Searching & Finding', 'Return Nth Element', 'returnNthElement', 'Return the element at the given zero-based index.', { nums: ['a', 'b', 'c', 'd'], index: 2 }, 'c'),
  q('Searching & Finding', 'Check Specific Elements Exist', 'hasAllElements', 'Return true if every required element exists in the array.', { nums: [1, 2, 3, 4], required: [2, 4] }, true),
  q('Searching & Finding', 'Search Two Elements', 'searchTwoElements', 'Return true if both target values exist in the array.', { nums: [5, 8, 11, 20], first: 8, second: 20 }, true),

  q('Sum Problems', 'Sum of Array', 'sumArray', 'Return the sum of all numbers in the array.', [5, 10, 15], 30),
  q('Sum Problems', 'Sum Using Reduce', 'sumUsingReduce', 'Return the sum using a reduce-style approach.', [4, 8, 15, 16], 43),
  q('Sum Problems', 'Sum Using forEach', 'sumUsingForEach', 'Return the sum using a forEach-style approach.', [3, 6, 9], 18),
  q('Sum Problems', 'Sum Using Arrow Function', 'sumUsingArrow', 'Return the sum using an arrow-function based approach.', [2, 4, 6, 8], 20),
  q('Sum Problems', 'Sum of Even Numbers', 'sumEvenNumbers', 'Return the sum of even numbers only.', [1, 2, 3, 4, 5, 6], 12),
  q('Sum Problems', 'Sum of Positive Numbers', 'sumPositiveNumbers', 'Return the sum of positive numbers only.', [-5, 10, -2, 7, 0], 17),
  q('Sum Problems', 'Sum of Prime Numbers', 'sumPrimeNumbers', 'Return the sum of prime numbers in the array.', [2, 3, 4, 5, 6, 7], 17),
  q('Sum Problems', 'Sum of Positive Numbers in Object Array', 'sumPositiveValues', 'Return the sum of positive amount values from the object array.', [{ amount: 10 }, { amount: -4 }, { amount: 7 }], 17, JS),

  q('Frequency Problems', 'Count Occurrences of all elements', 'countOccurrences', 'Return an object containing the frequency of every element.', [1, 2, 2, 3, 3, 3], { 1: 1, 2: 2, 3: 3 }),
  q('Frequency Problems', 'Most Frequent Element', 'mostFrequentElement', 'Return the element with the highest frequency.', [1, 2, 2, 3, 3, 3, 4], 3),
  q('Frequency Problems', 'Least Frequent Element', 'leastFrequentElement', 'Return the element with the lowest frequency.', [1, 2, 2, 3, 3, 3], 1),
  q('Frequency Problems', 'Second Most Frequent Element', 'secondMostFrequentElement', 'Return the element with the second highest frequency.', [1, 1, 2, 2, 2, 3, 3, 4], 1),
  q('Frequency Problems', 'Duplicate Elements', 'duplicateElements', 'Return elements that appear more than once.', [1, 2, 2, 3, 3, 3, 4], [2, 3]),
  q('Frequency Problems', 'Unique Elements', 'uniqueElements', 'Return elements that appear exactly once.', [1, 2, 2, 3, 4, 4], [1, 3]),
  q('Frequency Problems', 'First Repeating Element', 'firstRepeatingElement', 'Return the first element whose value repeats later.', [4, 5, 6, 5, 4], 4),
  q('Frequency Problems', 'First Non-Repeating Element', 'firstNonRepeatingElement', 'Return the first element that appears only once.', [4, 5, 4, 6, 5], 6),
  q('Frequency Problems', 'Elements Occurring Exactly Twice', 'occurringExactlyTwice', 'Return all elements that occur exactly twice.', [1, 2, 2, 3, 3, 3, 4, 4], [2, 4]),
  q('Frequency Problems', 'Elements Occurring More Than K Times', 'occurringMoreThanK', 'Return elements that occur more than k times.', { nums: [1, 2, 2, 3, 3, 3, 4], k: 2 }, [3]),

  q('Remove/Delete Problems', 'Remove Duplicates', 'removeDuplicates', 'Return an array with duplicates removed.', [1, 2, 2, 3, 1], [1, 2, 3]),
  q('Remove/Delete Problems', 'Remove Duplicate Even Numbers', 'removeDuplicateEvenNumbers', 'Remove repeated even numbers but keep other values.', [2, 2, 3, 4, 4, 5, 2], [2, 3, 4, 5]),
  q('Remove/Delete Problems', 'Remove Even Numbers', 'removeEvenNumbers', 'Return the array after removing even numbers.', [1, 2, 3, 4, 5, 6], [1, 3, 5]),
  q('Remove/Delete Problems', 'Remove Odd Numbers', 'removeOddNumbers', 'Return the array after removing odd numbers.', [1, 2, 3, 4, 5, 6], [2, 4, 6]),
  q('Remove/Delete Problems', 'Remove Consecutive Odd Numbers', 'removeConsecutiveOddNumbers', 'Remove odd numbers that are adjacent to another odd number.', [1, 3, 4, 5, 7, 8], [4, 8]),
  q('Remove/Delete Problems', 'Remove Multiples of 3', 'removeMultiplesOfThree', 'Return the array after removing multiples of 3.', [3, 4, 6, 8, 9, 10], [4, 8, 10]),
  q('Remove/Delete Problems', 'Remove Prime Numbers', 'removePrimeNumbers', 'Return the array after removing prime numbers.', [2, 3, 4, 5, 6, 8], [4, 6, 8]),
  q('Remove/Delete Problems', 'Remove Smallest Element', 'removeSmallestElement', 'Remove the smallest value from the array.', [4, 2, 8, 1, 5], [4, 2, 8, 5]),
  q('Remove/Delete Problems', 'Remove Falsy Values', 'removeFalsyValues', 'Return the array after removing falsy values.', [0, 1, false, 2, '', 3, null], [1, 2, 3]),
  q('Remove/Delete Problems', 'Remove Zeros', 'removeZeros', 'Return the array after removing all zeros.', [0, 1, 0, 2, 3, 0], [1, 2, 3]),
  q('Remove/Delete Problems', 'Remove Negative Numbers', 'removeNegativeNumbers', 'Return the array after removing negative numbers.', [-3, 4, -1, 0, 8], [4, 0, 8]),
  q('Remove/Delete Problems', 'Remove Numbers Greater Than X', 'removeGreaterThanX', 'Return values less than or equal to x.', { nums: [3, 9, 12, 5], x: 8 }, [3, 5]),
  q('Remove/Delete Problems', 'Remove Elements Present in Another Array', 'removeElementsFromAnotherArray', 'Remove all values that are present in the second array.', { nums: [1, 2, 3, 4, 5], remove: [2, 4] }, [1, 3, 5]),

  q('Insert/Delete Operations', 'Insert at Given Index', 'insertAtIndex', 'Insert the value at the given index.', { nums: [1, 2, 4], index: 2, value: 3 }, [1, 2, 3, 4]),
  q('Insert/Delete Operations', 'Insert into Sorted Array', 'insertIntoSortedArray', 'Insert the value while keeping the array sorted.', { nums: [1, 3, 5], value: 4 }, [1, 3, 4, 5]),
  q('Insert/Delete Operations', 'Insert Before Element', 'insertBeforeElement', 'Insert the value before the target element.', { nums: [1, 3, 4], target: 3, value: 2 }, [1, 2, 3, 4]),
  q('Insert/Delete Operations', 'Insert After Element', 'insertAfterElement', 'Insert the value after the target element.', { nums: [1, 2, 4], target: 2, value: 3 }, [1, 2, 3, 4]),
  q('Insert/Delete Operations', 'Delete by Value', 'deleteByValue', 'Delete all occurrences of the given value.', { nums: [1, 2, 3, 2], value: 2 }, [1, 3]),
  q('Insert/Delete Operations', 'Delete First Occurrence', 'deleteFirstOccurrence', 'Delete only the first occurrence of the value.', { nums: [1, 2, 3, 2], value: 2 }, [1, 3, 2]),
  q('Insert/Delete Operations', 'Delete Nth Occurrence', 'deleteNthOccurrence', 'Delete the nth occurrence of the value.', { nums: [1, 2, 3, 2, 4, 2], value: 2, occurrence: 2 }, [1, 2, 3, 4, 2]),
  q('Insert/Delete Operations', 'Delete All Occurrences', 'deleteAllOccurrences', 'Delete all occurrences of the value.', { nums: [1, 2, 2, 3], value: 2 }, [1, 3]),
  q('Insert/Delete Operations', 'Delete Last Element', 'deleteLastElement', 'Return the array without the last element.', [1, 2, 3, 4], [1, 2, 3]),
  q('Insert/Delete Operations', 'Delete Second Last Element', 'deleteSecondLastElement', 'Return the array without the second last element.', [1, 2, 3, 4], [1, 2, 4]),

  q('Rearrangement', 'Reverse Array', 'reverseArray', 'Return the array in reverse order.', [1, 2, 3, 4], [4, 3, 2, 1]),
  q('Rearrangement', 'Reverse In-Place', 'reverseInPlace', 'Reverse the array and return it.', [1, 2, 3, 4], [4, 3, 2, 1]),
  q('Rearrangement', 'Rotate Left', 'rotateLeft', 'Rotate the array left by one position.', [1, 2, 3, 4], [2, 3, 4, 1]),
  q('Rearrangement', 'Rotate Right', 'rotateRight', 'Rotate the array right by one position.', [1, 2, 3, 4], [4, 1, 2, 3]),
  q('Rearrangement', 'Rotate by K', 'rotateByK', 'Rotate the array right by k positions.', { nums: [1, 2, 3, 4, 5], k: 2 }, [4, 5, 1, 2, 3]),
  q('Rearrangement', 'Move Zeros to End', 'moveZerosToEnd', 'Move all zeros to the end while keeping non-zero order.', [0, 1, 0, 3, 12], [1, 3, 12, 0, 0]),
  q('Rearrangement', 'Move Zeros to Beginning', 'moveZerosToBeginning', 'Move all zeros to the beginning while keeping non-zero order.', [0, 1, 0, 3, 12], [0, 0, 1, 3, 12]),
  q('Rearrangement', 'Move Negatives to Front', 'moveNegativesToFront', 'Move negative numbers to the front.', [1, -2, 3, -4, 5], [-2, -4, 1, 3, 5]),
  q('Rearrangement', 'Alternate Positive and Negative', 'alternatePositiveNegative', 'Return values alternating positive and negative when possible.', [1, 2, 3, -1, -2, -3], [1, -1, 2, -2, 3, -3]),
  q('Rearrangement', 'Alternate Even and Odd', 'alternateEvenOdd', 'Return values alternating even and odd when possible.', [2, 4, 6, 1, 3, 5], [2, 1, 4, 3, 6, 5]),
  q('Rearrangement', 'Separate Even and Odd', 'separateEvenOdd', 'Return evens first and odds after them.', [1, 2, 3, 4, 5, 6], [2, 4, 6, 1, 3, 5]),

  q('Pair/Triplet Problems', 'Pair Sum Closest to Zero', 'pairSumClosestToZero', 'Return the pair whose sum is closest to zero.', [-8, -3, 4, 5, 9], [-3, 4]),
  q('Pair/Triplet Problems', 'Pair with Given Sum', 'pairWithGivenSum', 'Return a pair whose sum equals the target.', { nums: [2, 7, 11, 15], target: 9 }, [2, 7]),
  q('Pair/Triplet Problems', 'Pair with Given Difference', 'pairWithGivenDifference', 'Return a pair whose difference equals the target.', { nums: [5, 20, 3, 2, 50, 80], diff: 78 }, [2, 80]),
  q('Pair/Triplet Problems', 'Triplets with Given Sum', 'tripletsWithGivenSum', 'Return one triplet whose sum equals the target.', { nums: [1, 4, 45, 6, 10, 8], target: 22 }, [4, 10, 8]),
  q('Pair/Triplet Problems', 'Duplicate Pairs', 'duplicatePairs', 'Return pairs that appear more than once.', [[1, 2], [3, 4], [1, 2], [5, 6]], [[1, 2]]),

  q('Other Array Problems', 'Merge Arrays', 'mergeArrays', 'Return one array containing both arrays.', { first: [1, 2], second: [3, 4] }, [1, 2, 3, 4]),
  q('Other Array Problems', 'Merge Without Duplicates', 'mergeWithoutDuplicates', 'Merge arrays and remove duplicates.', { first: [1, 2, 3], second: [3, 4, 5] }, [1, 2, 3, 4, 5]),
  q('Other Array Problems', 'Flatten Nested Arrays', 'flattenNestedArrays', 'Return a flat array from the nested array.', [1, [2, 3], [4, [5]]], [1, 2, 3, 4, 5]),
  q('Other Array Problems', 'Chunk Array', 'chunkArray', 'Split the array into chunks of the given size.', { nums: [1, 2, 3, 4, 5], size: 2 }, [[1, 2], [3, 4], [5]]),
  q('Other Array Problems', 'Shuffle Array', 'shuffleArray', 'Return the same values in any shuffled order.', [1, 2, 3], [3, 1, 2]),
  q('Other Array Problems', 'Sort Without .sort()', 'sortWithoutSort', 'Return the numbers sorted ascending without using Array.sort.', [5, 1, 4, 2], [1, 2, 4, 5]),
  q('Other Array Problems', 'Sort Array of Objects', 'sortObjectsByAge', 'Sort users by age ascending.', [{ name: 'A', age: 30 }, { name: 'B', age: 20 }], [{ name: 'B', age: 20 }, { name: 'A', age: 30 }], JS),
  q('Other Array Problems', 'Equilibrium Index', 'equilibriumIndex', 'Return the index where left sum equals right sum.', [-7, 1, 5, 2, -4, 3, 0], 3),
  q('Other Array Problems', 'Leaders in Array', 'leadersInArray', 'Return elements greater than all elements to their right.', [16, 17, 4, 3, 5, 2], [17, 5, 2]),
  q('Other Array Problems', 'Majority Element', 'majorityElement', 'Return the element appearing more than n/2 times.', [3, 3, 4, 2, 3, 3, 5], 3),
  q('Other Array Problems', "Max Consecutive 1's", 'maxConsecutiveOnes', 'Return the maximum count of consecutive 1 values.', [1, 1, 0, 1, 1, 1], 3),
  q('Other Array Problems', 'FizzBuzz', 'fizzBuzz', 'Return FizzBuzz values from 1 to n.', 5, [1, 2, 'Fizz', 4, 'Buzz']),
  q('Other Array Problems', 'Swap Elements', 'swapElements', 'Swap values at the two given indexes.', { nums: [1, 2, 3, 4], i: 1, j: 3 }, [1, 4, 3, 2]),
  q('Other Array Problems', 'Convert String Array to Object', 'stringArrayToObject', 'Convert keys into an object with true values.', ['name', 'age'], { name: true, age: true }, JS),
  q('Other Array Problems', 'Title Case Array Strings', 'titleCaseArray', 'Return every string in title case.', ['hello world', 'good morning'], ['Hello World', 'Good Morning'], JS),
  q('Other Array Problems', 'Print Specific Patterns', 'printPattern', 'Return a triangle star pattern with n rows.', 3, ['*', '**', '***'], JS),

  q('String Basic Manipulations', 'Remove Vowels', 'removeVowels', 'Return the string without vowels.', 'hello world', 'hll wrld'),
  q('String Basic Manipulations', 'Remove Consonants', 'removeConsonants', 'Return only vowels and spaces from the string.', 'hello world', 'eo o'),
  q('String Basic Manipulations', 'Remove Duplicate Characters', 'removeDuplicateCharacters', 'Return the string with duplicate characters removed.', 'programming', 'progamin'),
  q('String Basic Manipulations', 'Remove Duplicate Words', 'removeDuplicateWords', 'Return the sentence with duplicate words removed.', 'this is is good good', 'this is good'),
  q('String Basic Manipulations', 'Remove Special Characters', 'removeSpecialCharacters', 'Return only letters, numbers, and spaces.', 'Hi! JS@2026', 'Hi JS2026'),
  q('String Basic Manipulations', 'Remove Digits', 'removeDigits', 'Return the string without digits.', 'a1b2c3', 'abc'),
  q('String Basic Manipulations', 'Keep Only Digits', 'keepOnlyDigits', 'Return only the digits from the string.', 'a1b2c3', '123'),
  q('String Basic Manipulations', 'Remove Whitespaces', 'removeWhitespaces', 'Return the string without whitespace.', 'a b c d', 'abcd'),
  q('String Basic Manipulations', 'Remove Specific Character', 'removeSpecificCharacter', 'Remove all occurrences of the given character.', { text: 'banana', char: 'a' }, 'bnn'),

  q('String Reversal Problems', 'Reverse String', 'reverseString', 'Return the reversed string.', 'javascript', 'tpircsavaj'),
  q('String Reversal Problems', 'Reverse Without Built-ins', 'reverseWithoutBuiltIns', 'Reverse the string without using built-in reverse.', 'hello', 'olleh'),
  q('String Reversal Problems', 'Reverse Using Prototype', 'reverseUsingPrototype', 'Return the reversed string as if implemented on String prototype.', 'hello', 'olleh', JS),
  q('String Reversal Problems', 'Reverse Word Order', 'reverseWordOrder', 'Reverse the order of words.', 'hello world', 'world hello'),
  q('String Reversal Problems', 'Reverse Alternate Words', 'reverseAlternateWords', 'Reverse every alternate word.', 'one two three four', 'one owt three ruof'),
  q('String Reversal Problems', 'Reverse Vowels', 'reverseVowels', 'Reverse only vowels in the string.', 'hello', 'holle'),
  q('String Reversal Problems', 'Reverse Consonants', 'reverseConsonants', 'Reverse only consonants in the string.', 'hello', 'lelho'),
  q('String Reversal Problems', '"How Are You" -> "woH erA uoY"', 'reverseEachWord', 'Reverse each word but keep word order.', 'How Are You', 'woH erA uoY'),
  q('String Reversal Problems', '"hello world" -> "olleh dleow"', 'reverseEachWordLetters', 'Reverse letters inside each word.', 'hello world', 'olleh dlrow'),

  q('String Case Conversion', 'Capitalize First Letter', 'capitalizeFirstLetter', 'Capitalize the first letter of the string.', 'javascript', 'Javascript', JS),
  q('String Case Conversion', 'Capitalize Last Letter', 'capitalizeLastLetter', 'Capitalize the last letter of the string.', 'javascript', 'javascripT', JS),
  q('String Case Conversion', 'Capitalize Every Word', 'capitalizeEveryWord', 'Capitalize the first letter of every word.', 'hello world', 'Hello World', JS),
  q('String Case Conversion', 'Toggle Case', 'toggleCase', 'Convert lowercase to uppercase and uppercase to lowercase.', 'HeLLo', 'hEllO', JS),
  q('String Case Conversion', 'Uppercase to Lowercase Without Built-ins', 'upperToLowerWithoutBuiltIns', 'Convert uppercase letters to lowercase without using toLowerCase.', 'HELLO', 'hello', JS),

  q('String Counting Problems', 'Count Vowels', 'countVowels', 'Return the number of vowels.', 'Interview Forge', 6),
  q('String Counting Problems', 'Count Consonants', 'countConsonants', 'Return the number of consonants.', 'hello world', 7),
  q('String Counting Problems', 'Count Words', 'countWords', 'Return the number of words.', 'hello world again', 3),
  q('String Counting Problems', 'Word Frequency', 'wordFrequency', 'Return word frequencies.', 'cat dog cat bird', { cat: 2, dog: 1, bird: 1 }),
  q('String Counting Problems', 'Uppercase/Lowercase Count', 'upperLowerCount', 'Return uppercase and lowercase character counts.', 'HeLLo', { uppercase: 3, lowercase: 2 }, JS),

  q('String Character Problems', 'Unique Characters', 'uniqueCharacters', 'Return characters that appear only once.', 'programming', ['p', 'r', 'o', 'a', 'i', 'n']),
  q('String Character Problems', 'First Non-Repeating Character', 'firstNonRepeatingChar', 'Return the first non-repeating character.', 'swiss', 'w'),
  q('String Character Problems', 'First Repeating Character', 'firstRepeatingChar', 'Return the first repeating character.', 'programming', 'r'),
  q('String Character Problems', 'Last Non-Repeating Character', 'lastNonRepeatingChar', 'Return the last non-repeating character.', 'swiss', 'w'),
  q('String Character Problems', 'Last Repeating Character', 'lastRepeatingChar', 'Return the last character that repeats.', 'programming', 'g'),

  q('Other String Problems', 'Longest Word', 'longestWord', 'Return the longest word in the sentence.', 'I love JavaScript programming', 'programming'),
  q('Other String Problems', 'Shortest Word', 'shortestWord', 'Return the shortest word in the sentence.', 'I love JavaScript', 'I'),
  q('Other String Problems', 'Longest Consecutive Characters', 'longestConsecutiveCharacters', 'Return the longest run of the same character.', 'aaabbccccd', 'cccc'),
  q('Other String Problems', 'Find Extra Characters', 'findExtraCharacters', 'Return characters present in second string but not in first.', { first: 'abc', second: 'abcz' }, ['z']),
  q('Other String Problems', 'Anagram Check', 'isAnagram', 'Return true if the two strings are anagrams.', { first: 'listen', second: 'silent' }, true),
  q('Other String Problems', 'Sort Characters Alphabetically', 'sortCharactersAlphabetically', 'Return characters sorted alphabetically.', 'dcba', 'abcd'),
  q('Other String Problems', 'Missing Letter', 'missingLetter', 'Return the missing letter in the alphabet sequence.', 'abce', 'd'),
  q('Other String Problems', 'Title Case Conversion', 'titleCaseConversion', 'Convert the sentence to title case.', 'hello world', 'Hello World'),

  q('Prime Number Questions', 'Check Prime', 'isPrime', 'Return true if the number is prime.', 29, true),
  q('Prime Number Questions', 'Print Primes (1 to n)', 'primesUpToN', 'Return all prime numbers from 1 to n.', 10, [2, 3, 5, 7]),
  q('Prime Number Questions', 'Count Primes in Array', 'countPrimesInArray', 'Return the number of prime values in the array.', [2, 3, 4, 5, 6], 3),
  q('Prime Number Questions', 'Remove Prime Numbers', 'removePrimeNumbers', 'Remove prime numbers from the array.', [2, 3, 4, 5, 6], [4, 6]),
  q('Prime Number Questions', 'Replace Primes with 0', 'replacePrimesWithZero', 'Replace every prime number with 0.', [2, 3, 4, 5], [0, 0, 4, 0]),
  q('Prime Number Questions', 'Largest Prime', 'largestPrime', 'Return the largest prime number in the array.', [4, 11, 8, 17, 20], 17),
  q('Prime Number Questions', 'Smallest Prime', 'smallestPrime', 'Return the smallest prime number in the array.', [4, 11, 8, 17, 2], 2),
  q('Prime Number Questions', 'Nth Prime', 'nthPrime', 'Return the nth prime number.', 5, 11),
  q('Prime Number Questions', 'Check Every Element is Prime', 'everyElementPrime', 'Return true if every array element is prime.', [2, 3, 5, 7], true),

  q('Palindrome Questions', 'String Palindrome', 'isStringPalindrome', 'Return true if the string is a palindrome.', 'madam', true),
  q('Palindrome Questions', 'Number Palindrome', 'isNumberPalindrome', 'Return true if the number is a palindrome.', 121, true),
  q('Palindrome Questions', 'Recursive Palindrome', 'recursivePalindrome', 'Return true if the string is a palindrome using recursion.', 'racecar', true),
  q('Palindrome Questions', 'Find Palindromes in Array', 'findPalindromes', 'Return all palindrome strings from the array.', ['madam', 'hello', 'level'], ['madam', 'level']),
  q('Palindrome Questions', 'Count Palindrome Words', 'countPalindromeWords', 'Return the number of palindrome words.', 'madam speaks level noon', 3),
  q('Palindrome Questions', 'Remove Palindrome Strings', 'removePalindromeStrings', 'Remove palindrome strings from the array.', ['madam', 'hello', 'level'], ['hello']),
  q('Palindrome Questions', 'Longest Palindrome Word', 'longestPalindromeWord', 'Return the longest palindrome word.', 'madam racecar level', 'racecar'),

  q('Number-Based Questions', 'Reverse Number', 'reverseNumber', 'Return the number with digits reversed.', 12345, 54321),
  q('Number-Based Questions', 'Sum of Digits', 'sumOfDigits', 'Return the sum of digits.', 1234, 10),
  q('Number-Based Questions', 'Product of Digits', 'productOfDigits', 'Return the product of digits.', 1234, 24),
  q('Number-Based Questions', 'Count Digits', 'countDigits', 'Return the number of digits.', 12345, 5),
  q('Number-Based Questions', 'Largest Digit', 'largestDigit', 'Return the largest digit.', 3942, 9),
  q('Number-Based Questions', 'Smallest Digit', 'smallestDigit', 'Return the smallest digit.', 3942, 2),
  q('Number-Based Questions', 'Even or Odd', 'evenOrOdd', 'Return "even" or "odd".', 7, 'odd'),
  q('Number-Based Questions', 'Positive/Negative/Zero', 'positiveNegativeZero', 'Return whether the number is positive, negative, or zero.', -5, 'negative'),

  q('Special Number Problems', 'Armstrong', 'isArmstrong', 'Return true if the number is an Armstrong number.', 153, true),
  q('Special Number Problems', 'Perfect', 'isPerfect', 'Return true if the number is a perfect number.', 28, true),
  q('Special Number Problems', 'Strong', 'isStrong', 'Return true if the number is a strong number.', 145, true),
  q('Special Number Problems', 'Harshad/Niven', 'isHarshad', 'Return true if the number is divisible by the sum of its digits.', 18, true),
  q('Special Number Problems', 'Neon', 'isNeon', 'Return true if the sum of digits of n squared equals n.', 9, true),
  q('Special Number Problems', 'Spy', 'isSpy', 'Return true if sum of digits equals product of digits.', 1124, true),
  q('Special Number Problems', 'Automorphic', 'isAutomorphic', 'Return true if n squared ends with n.', 76, true),
  q('Special Number Problems', 'Happy', 'isHappy', 'Return true if repeatedly summing squares of digits reaches 1.', 19, true),
  q('Special Number Problems', 'Duck', 'isDuck', 'Return true if the number contains zero but does not start with zero.', 1023, true),
  q('Special Number Problems', 'Disarium', 'isDisarium', 'Return true if sum of digits powered by position equals the number.', 135, true),

  q('Mathematical Problems', 'Fibonacci', 'fibonacci', 'Return the nth Fibonacci number using zero-based indexing.', 7, 13),
  q('Mathematical Problems', 'Factorial', 'factorial', 'Return the factorial of n.', 5, 120),
  q('Mathematical Problems', 'GCD/HCF', 'gcd', 'Return the greatest common divisor.', { a: 48, b: 18 }, 6),
  q('Mathematical Problems', 'LCM', 'lcm', 'Return the least common multiple.', { a: 4, b: 6 }, 12),
  q('Mathematical Problems', 'Swap Without Third Variable', 'swapWithoutThirdVariable', 'Return both values after swapping without a third variable.', { a: 5, b: 10 }, { a: 10, b: 5 }, JS),

  q('Object Basic Operations', 'Check Empty Object', 'isEmptyObject', 'Return true if the object has no own keys.', {}, true, JS),
  q('Object Basic Operations', 'Delete Property', 'deleteProperty', 'Delete the specified property and return the object.', { obj: { name: 'Arun', age: 25 }, key: 'age' }, { name: 'Arun' }, JS),
  q('Object Basic Operations', 'Add Property', 'addProperty', 'Add the key and value to the object.', { obj: { name: 'Arun' }, key: 'age', value: 25 }, { name: 'Arun', age: 25 }, JS),
  q('Object Basic Operations', 'Merge Objects', 'mergeObjects', 'Return one merged object.', { first: { a: 1 }, second: { b: 2 } }, { a: 1, b: 2 }, JS),
  q('Object Basic Operations', 'Sum Object Values', 'sumObjectValues', 'Return the sum of numeric object values.', { a: 10, b: 20, c: 'x' }, 30, JS),
  q('Object Basic Operations', 'Iterate Objects', 'iterateObject', 'Return key-value pairs from the object.', { a: 1, b: 2 }, [['a', 1], ['b', 2]], JS),

  q('Object Advanced Concepts', 'Deep Copy', 'deepCopyObject', 'Return a deep copy of the object.', { user: { name: 'A', scores: [1, 2] } }, { user: { name: 'A', scores: [1, 2] } }, JS),
  q('Object Advanced Concepts', 'Shallow Copy', 'shallowCopyObject', 'Return a shallow copy of the object.', { a: 1, nested: { b: 2 } }, { a: 1, nested: { b: 2 } }, JS),
  q('Object Advanced Concepts', 'Freeze/Seal', 'freezeObject', 'Freeze the object and return whether it is frozen.', { a: 1 }, true, JS),
  q('Object Advanced Concepts', 'Nested Destructuring', 'nestedDestructuring', 'Return the nested city value using destructuring.', { user: { address: { city: 'Kochi' } } }, 'Kochi', JS),
  q('Object Advanced Concepts', 'Object Destructuring', 'objectDestructuring', 'Return name and age using destructuring.', { name: 'Arun', age: 25 }, { name: 'Arun', age: 25 }, JS),
  q('Object Advanced Concepts', 'Prototype Chaining', 'prototypeChaining', 'Return inherited property value from an object prototype chain.', { inherited: 'base' }, 'base', JS),

  q('Object Problems', 'Remove Last Property', 'removeLastProperty', 'Remove the last inserted property from the object.', { a: 1, b: 2, c: 3 }, { a: 1, b: 2 }, JS),
  q('Object Problems', 'Remove Odd-Valued Properties', 'removeOddValuedProperties', 'Remove properties whose values are odd numbers.', { a: 1, b: 2, c: 3, d: 4 }, { b: 2, d: 4 }, JS),
  q('Object Problems', 'Highest Value Key', 'highestValueKey', 'Return the key with the highest numeric value.', { a: 10, b: 30, c: 20 }, 'b', JS),
  q('Object Problems', 'Lowest Value Key', 'lowestValueKey', 'Return the key with the lowest numeric value.', { a: 10, b: 30, c: 20 }, 'a', JS),
  q('Object Problems', 'Parent Object to Array', 'parentObjectToArray', 'Convert object entries to an array.', { a: 1, b: 2 }, [['a', 1], ['b', 2]], JS),
  q('Object Problems', 'Throw Error Based on Datatype', 'throwErrorBasedOnDatatype', 'Return an error message when the value is not a number.', 'abc', 'Invalid type: expected number', JS),

  q('Array of Objects', 'Total Product Price', 'totalProductPrice', 'Return total price from products.', [{ price: 10, qty: 2 }, { price: 5, qty: 3 }], 35, JS),
  q('Array of Objects', 'Students Per Class', 'studentsPerClass', 'Group student counts by class.', [{ class: 'A' }, { class: 'B' }, { class: 'A' }], { A: 2, B: 1 }, JS),
  q('Array of Objects', 'Highest Score', 'highestScore', 'Return the student with the highest score.', [{ name: 'A', score: 80 }, { name: 'B', score: 95 }], { name: 'B', score: 95 }, JS),
  q('Array of Objects', 'Add Pass/Fail Status', 'addPassFailStatus', 'Add pass/fail status based on score >= 50.', [{ name: 'A', score: 80 }, { name: 'B', score: 40 }], [{ name: 'A', score: 80, status: 'pass' }, { name: 'B', score: 40, status: 'fail' }], JS),
  q('Array of Objects', 'Most Aged User', 'mostAgedUser', 'Return the user with the highest age.', [{ name: 'A', age: 20 }, { name: 'B', age: 30 }], { name: 'B', age: 30 }, JS),
  q('Array of Objects', 'Average Age', 'averageAge', 'Return average age.', [{ age: 20 }, { age: 30 }, { age: 40 }], 30, JS),
  q('Array of Objects', 'Remove Duplicate Objects', 'removeDuplicateObjects', 'Remove duplicate objects by id.', [{ id: 1, name: 'A' }, { id: 1, name: 'A' }, { id: 2, name: 'B' }], [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], JS),
  q('Array of Objects', 'Group By Property', 'groupByProperty', 'Group objects by the given property.', { items: [{ type: 'fruit', name: 'apple' }, { type: 'veg', name: 'carrot' }], key: 'type' }, { fruit: [{ type: 'fruit', name: 'apple' }], veg: [{ type: 'veg', name: 'carrot' }] }, JS),
  q('Array of Objects', 'Count By Category', 'countByCategory', 'Return counts grouped by category.', [{ category: 'A' }, { category: 'B' }, { category: 'A' }], { A: 2, B: 1 }, JS),
  q('Array of Objects', 'Rename Keys', 'renameKeys', 'Rename object keys according to the map.', { obj: { fname: 'Arun' }, map: { fname: 'firstName' } }, { firstName: 'Arun' }, JS),
  q('Array of Objects', 'Remove Null/Undefined', 'removeNullUndefined', 'Remove null and undefined properties from the object.', { a: 1, b: null, c: undefined }, { a: 1 }, JS),
  q('Array of Objects', 'Sort by Name/Age/Salary', 'sortByAge', 'Sort users by age ascending.', [{ name: 'B', age: 30 }, { name: 'A', age: 20 }], [{ name: 'A', age: 20 }, { name: 'B', age: 30 }], JS),

  q('Functions & Advanced Concepts', 'Arrow Functions', 'arrowFunction', 'Return the sum using an arrow-function style.', { a: 2, b: 3 }, 5, JS),
  q('Functions & Advanced Concepts', 'Rest Parameters', 'restParameters', 'Return the sum of all arguments represented as an array.', [1, 2, 3, 4], 10, JS),
  q('Functions & Advanced Concepts', 'Higher-Order Functions', 'higherOrderFunction', 'Apply the named operation to every number.', { nums: [1, 2, 3], operation: 'double' }, [2, 4, 6], JS),
  q('Functions & Advanced Concepts', 'Currying', 'curriedAddition', 'Return the result of curried addition.', { a: 2, b: 3, c: 4 }, 9, JS),
  q('Functions & Advanced Concepts', 'Function Borrowing', 'functionBorrowing', 'Borrow a fullName function for another object and return the name.', { firstName: 'Arun', lastName: 'K' }, 'Arun K', JS),
  q('Functions & Advanced Concepts', 'Factory Functions', 'factoryFunction', 'Return an object created by a factory function.', { name: 'Arun', role: 'Developer' }, { name: 'Arun', role: 'Developer' }, JS),
  q('Functions & Advanced Concepts', 'Generators', 'generatorSequence', 'Return the first n values from a generator-like sequence.', 4, [1, 2, 3, 4], JS),
  q('Functions & Advanced Concepts', 'Pure vs Impure Functions', 'pureFunction', 'Return a new array without mutating the input.', [1, 2, 3], [2, 4, 6], JS),
  q('Functions & Advanced Concepts', 'Recursion', 'recursiveSum', 'Return the sum from 1 to n using recursion.', 5, 15, JS),
  q('Functions & Advanced Concepts', 'Recursive Factorial', 'recursiveFactorial', 'Return factorial using recursion.', 5, 120, JS),
  q('Functions & Advanced Concepts', 'Recursive Fibonacci', 'recursiveFibonacci', 'Return nth Fibonacci using recursion.', 6, 8, JS),
  q('Functions & Advanced Concepts', 'Recursive Palindrome', 'recursivePalindrome', 'Return true if the string is palindrome using recursion.', 'level', true, JS),

  q('Loops', 'Sum of First 5 Multiples of 3', 'sumFirstFiveMultiplesOfThree', 'Return the sum of the first five multiples of 3.', null, 45, JS),
  q('Loops', 'Print 1-10', 'printOneToTen', 'Return numbers from 1 to 10.', null, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], JS),
  q('Loops', 'Print 1-10 with Delay', 'printOneToTenWithDelay', 'Return the numbers that would be printed with delay.', null, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], JS),
  q('Loops', 'Countdown Timer', 'countdownTimer', 'Return countdown values from n to 0.', 5, [5, 4, 3, 2, 1, 0], JS),
  q('Loops', 'Even Numbers (20 to 2)', 'evenNumbersTwentyToTwo', 'Return even numbers from 20 down to 2.', null, [20, 18, 16, 14, 12, 10, 8, 6, 4, 2], JS),
  q('Loops', 'Reverse Multiples of 5', 'reverseMultiplesOfFive', 'Return multiples of 5 from n down to 5.', 25, [25, 20, 15, 10, 5], JS),
  q('Loops', 'Even/Odd Check', 'evenOddCheck', 'Return whether the number is even or odd.', 8, 'even', JS),
  q('Loops', 'Maximum of Two Numbers', 'maximumOfTwoNumbers', 'Return the larger of two numbers.', { a: 10, b: 25 }, 25, JS),
];

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[`'"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CURATED_BY_SUBJECT_AND_TITLE = new Map();
for (const item of CODE_PRACTICE_QUESTIONS) {
  for (const subject of item.subjects) {
    CURATED_BY_SUBJECT_AND_TITLE.set(`${subject}:${normalizeTitle(item.title)}`, item);
  }
}

function findCuratedCodeQuestion(subject, title) {
  return CURATED_BY_SUBJECT_AND_TITLE.get(`${subject}:${normalizeTitle(title)}`) || null;
}

module.exports = {
  CODE_PRACTICE_QUESTIONS,
  findCuratedCodeQuestion,
  normalizeTitle,
};
