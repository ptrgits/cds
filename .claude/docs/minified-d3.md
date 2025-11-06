# Minimal Scale Implementations

This document describes the minimum implementation needed to reuse D3 scale functions outside of D3, focusing only on the core scale transformation without auxiliary methods like `.nice()`, `.tickFormat()`, etc.

## Linear Scale - Minimum Implementation

The core is just linear interpolation between domain and range:

```javascript
function minimalLinear(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;

  return function (x) {
    const t = (x - d0) / (d1 - d0); // normalize to [0, 1]
    return r0 + t * (r1 - r0); // interpolate in range
  };
}

// Usage:
const scale = minimalLinear([0, 100], [0, 500]);
scale(50); // returns 250
```

### How it works:

1. Normalize input `x` to a value between 0 and 1 based on domain
2. Interpolate that normalized value in the output range

---

## Log Scale - Minimum Implementation

Core is logarithmic transformation + interpolation:

```javascript
function minimalLog(domain, range, base = 10) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const logBase =
    base === 10 ? Math.log10 : base === Math.E ? Math.log : (x) => Math.log(x) / Math.log(base);

  return function (x) {
    const t = (logBase(x) - logBase(d0)) / (logBase(d1) - logBase(d0));
    return r0 + t * (r1 - r0);
  };
}

// Usage:
const scale = minimalLog([1, 100], [0, 500]);
scale(10); // returns 250
```

### How it works:

1. Apply logarithmic transformation to input and domain bounds
2. Normalize the transformed value to [0, 1]
3. Interpolate in the output range

### Notes:

- Default base is 10
- Domain values must be positive (or all negative)
- Common bases: 10, Math.E (natural log), or 2

---

## Band Scale - Minimum Implementation

Core is dividing range into equal bands for categorical data:

```javascript
function minimalBand(domain, range) {
  const [r0, r1] = range;
  const n = domain.length;
  const step = (r1 - r0) / n;

  // Create lookup map for positions
  const positions = new Map();
  domain.forEach((d, i) => {
    positions.set(d, r0 + step * i);
  });

  const scale = function (x) {
    return positions.get(x);
  };

  scale.bandwidth = () => step;

  return scale;
}

// Usage:
const scale = minimalBand([0, 1, 2, 3], [0, 100]);
scale(0); // returns 0
scale(1); // returns 25
scale(2); // returns 50
scale(3); // returns 75
scale.bandwidth(); // returns 25
```

### How it works:

1. Divide the output range into `n` equal bands (where `n` is domain length)
2. Map each domain value to the start of its corresponding band
3. Provide `.bandwidth()` method to get the width of each band

### Notes:

- Domain is an array of categorical values (can be numbers, strings, or any values)
- If domain is `[0, 1, 2, 3]`, that's 4 categories
- Each category gets an equal-width band in the output range
- The scale returns the **start position** of each band
- Use `.bandwidth()` to get the width of each band for rendering

---

## Key Differences from Full D3 Implementation

These minimal versions exclude:

- **No `.nice()`** - No automatic domain rounding to nice round numbers
- **No `.tickFormat()` / `.ticks()`** - No axis tick generation
- **No `.invert()`** - No reverse mapping (range → domain)
- **No `.clamp()`** - No clamping output to range bounds
- **No padding options** - Band scales don't have `paddingInner`, `paddingOuter`, or `align`
- **No `.copy()`** - No cloning functionality
- **No multi-segment domains** - Linear/log scales only support 2-element domains (not polylinear)
- **No `.rangeRound()`** - No automatic rounding of output values
- **No negative domain handling** - Log scale doesn't handle negative domains with reflection

---

## When to Use Each Scale

### Linear Scale

- **Use for:** Continuous quantitative data with linear relationships
- **Examples:** Temperature, distance, price, age
- **Domain:** Two numeric values `[min, max]`
- **Range:** Two numeric values `[min, max]`

### Log Scale

- **Use for:** Data spanning multiple orders of magnitude
- **Examples:** Population, wealth distribution, earthquake magnitude, web traffic
- **Domain:** Two positive numeric values `[min, max]` (or both negative)
- **Range:** Two numeric values `[min, max]`
- **Important:** Domain values must have the same sign (both positive or both negative)

### Band Scale

- **Use for:** Categorical data, bar charts, grouped data
- **Examples:** Product categories, months, countries, age groups
- **Domain:** Array of category identifiers (strings, numbers, or any values)
- **Range:** Two numeric values `[min, max]` representing the output space
- **Returns:** Start position of each category's band

---

## Examples

### Linear Scale - Temperature Conversion

```javascript
// Map Celsius [-40, 40] to pixel position [0, 400]
const tempScale = minimalLinear([-40, 40], [0, 400]);
tempScale(-40); // 0px
tempScale(0); // 200px (middle)
tempScale(40); // 400px
```

### Log Scale - Population

```javascript
// Map population [1000, 1000000] to radius [5, 50]
const popScale = minimalLog([1000, 1000000], [5, 50]);
popScale(1000); // 5
popScale(10000); // ~20
popScale(100000); // ~35
popScale(1000000); // 50
```

### Band Scale - Bar Chart

```javascript
// Map 5 categories to 500px width
const barScale = minimalBand(['A', 'B', 'C', 'D', 'E'], [0, 500]);
barScale('A'); // 0
barScale('B'); // 100
barScale('C'); // 200
barScale('D'); // 300
barScale('E'); // 400
barScale.bandwidth(); // 100 (each bar is 100px wide)
```

---

## Implementation Notes

These minimal implementations are pure functions that:

1. Accept domain and range as constructor parameters
2. Return a function that performs the core transformation
3. Have no dependencies on D3 (except for understanding the concepts)
4. Are suitable for standalone use in any JavaScript environment
5. Prioritize simplicity over features

For production use, consider adding:

- Input validation
- Clamping options
- Invert functionality (if needed)
- Error handling for edge cases (NaN, Infinity, etc.)
