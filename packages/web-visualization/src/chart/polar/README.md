# Polar Charts

Polar charts for visualizing proportional data using pie and donut charts.

## Components

### PieChart

A pie chart component for visualizing proportional data where each slice represents a value as a proportion of the total.

```tsx
import { PieChart } from '@coinbase/cds-web-visualization';

const data = [
  { value: 30, label: 'Bitcoin', color: 'var(--color-accentBoldOrange)' },
  { value: 20, label: 'Ethereum', color: 'var(--color-accentBoldBlue)' },
  { value: 15, label: 'USDC', color: 'var(--color-accentBoldGreen)' },
];

<PieChart data={data} height={300} width={300} />;
```

### DonutChart

A donut chart with a hollow center, perfect for displaying additional information in the middle.

```tsx
import { DonutChart } from '@coinbase/cds-web-visualization';

const data = [
  { value: 450, label: 'Trading' },
  { value: 280, label: 'Staking' },
  { value: 150, label: 'Lending' },
];

<DonutChart data={data} height={300} width={300} innerRadiusRatio={0.6}>
  <text
    x="50%"
    y="50%"
    textAnchor="middle"
    dominantBaseline="middle"
    fill="var(--color-fgPrimary)"
    fontSize="32"
    fontWeight="bold"
  >
    $880
  </text>
</DonutChart>;
```

## Props

### Common Props

Both `PieChart` and `DonutChart` support the following props:

- `data`: Array of data points with `value`, `label`, `color`, and `id` properties
- `animate`: Whether to animate the chart (default: true)
- `padAngle`: Padding angle between slices in radians (default: 0)
- `startAngle`: Start angle in radians (default: 0)
- `endAngle`: End angle in radians (default: 2π)
- `fillOpacity`: Opacity of the fill (0-1)
- `stroke`: Stroke color
- `strokeWidth`: Stroke width in pixels
- `cornerRadius`: Corner radius for rounded slices
- `padding`: Minimum padding around the chart in pixels
- `onArcClick`: Callback fired when a slice is clicked
- `onArcMouseEnter`: Callback fired when mouse enters a slice
- `onArcMouseLeave`: Callback fired when mouse leaves a slice

### DonutChart-Specific Props

- `innerRadiusRatio`: Inner radius as a ratio of outer radius (0-1, default: 0.5)

## Advanced Usage

### Custom Arc Component

You can provide a custom Arc component to customize slice rendering:

```tsx
import { Arc } from '@coinbase/cds-web-visualization';

const CustomArc = (props) => <Arc {...props} fillOpacity={0.8} />;

<PieChart data={data} ArcComponent={CustomArc} />;
```

### Interactive Charts

Handle user interactions with callback props:

```tsx
<PieChart
  data={data}
  onArcClick={(data, index, event) => {
    console.log('Clicked:', data.label, data.value);
  }}
  onArcMouseEnter={(data, index, event) => {
    // Show tooltip
  }}
  onArcMouseLeave={(data, index, event) => {
    // Hide tooltip
  }}
/>
```

### Partial Circles

Create partial pie/donut charts by adjusting start and end angles:

```tsx
// Half circle
<PieChart data={data} startAngle={0} endAngle={Math.PI} />

// Three-quarter circle
<DonutChart data={data} startAngle={-Math.PI / 2} endAngle={Math.PI} />
```

## Architecture

The polar chart system consists of:

1. **PolarChart**: Base component that provides context and layout
2. **PolarChartProvider**: Context provider for sharing chart state
3. **Arc**: Component for rendering individual slices
4. **PiePlot**: Component that renders all arcs from data
5. **Utils**: Helper functions for arc calculations and path generation

## Color Scheme

By default, polar charts use the following colors in order:

1. `var(--color-primary)`
2. `var(--color-positive)`
3. `var(--color-attention)`
4. `var(--color-negative)`
5. `var(--color-info)`
6. `var(--color-accent)`

You can override colors by providing a `color` property in each data point.
