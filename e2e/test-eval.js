// Simple test of the evaluation logic
const value = {
  content: [
    {
      type: "text",
      text: "4"
    }
  ]
};

function getPropertyValue(obj, path) {
  if (!obj || typeof obj !== 'object') return undefined;
  
  try {
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return undefined;
      
      // Handle array access like "content[0]"
      if (key.includes('[') && key.includes(']')) {
        const match = key.match(/^(.+?)\[(\d+)\]$/);
        if (match) {
          const [, propName, indexStr] = match;
          const index = parseInt(indexStr, 10);
          const arrayValue = current[propName];
          return Array.isArray(arrayValue) ? arrayValue[index] : undefined;
        }
      }
      
      return current[key];
    }, obj);
  } catch {
    return undefined;
  }
}

function evaluateExpectation(value, expectation) {
  // Handle simple property existence checks (e.g., "content && content.length > 0")
  if (expectation.includes('&&')) {
    const parts = expectation.split('&&').map(part => part.trim());
    console.log('Parts:', parts);
    return parts.every(part => {
      if (part.includes('>') || part.includes('<') || part.includes('===')) {
        console.log('Evaluating comparison:', part);
        return evaluatePropertyExpectation(value, part);
      } else {
        const propValue = getPropertyValue(value, part);
        console.log('Checking property:', part, '=', propValue);
        return Boolean(propValue);
      }
    });
  }
  return false;
}

function evaluatePropertyExpectation(value, expectation) {
  // Handle patterns like "results.length > 0"
  const comparisonMatch = expectation.match(/^(.+?)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+)$/);
  if (comparisonMatch) {
    const [, propertyPath, operator, expectedValueStr] = comparisonMatch;
    const actualValue = getPropertyValue(value, propertyPath.trim());
    console.log('Property path:', propertyPath, '=> actualValue:', actualValue);
    const expectedValue = parseFloat(expectedValueStr.trim());
    console.log('Comparing:', actualValue, operator, expectedValue);
    
    switch (operator) {
      case '>': return actualValue > expectedValue;
      case '>=': return actualValue >= expectedValue;
      case '<': return actualValue < expectedValue;
      case '<=': return actualValue <= expectedValue;
      case '==': case '===': return actualValue === expectedValue;
      default: return false;
    }
  }
  return false;
}

const expectation = 'content && content.length > 0';
console.log('Value:', JSON.stringify(value));
console.log('Expectation:', expectation);
console.log('Result:', evaluateExpectation(value, expectation));
