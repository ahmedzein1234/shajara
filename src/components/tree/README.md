# Family Tree Visualization Components

Beautiful, interactive family tree visualization for the Shajara Arabic family tree application.

## Components Overview

### 1. **FamilyTree.tsx** - Main Component
The primary component for rendering and interacting with the family tree.

**Features:**
- SVG-based rendering for crisp visuals at any zoom level
- Pan and zoom with mouse/touch
- RTL (Right-to-Left) support for Arabic layout
- Multiple layout modes (descendants, ancestors, hourglass, full)
- Search functionality
- Export to PNG, JPEG, SVG, or PDF
- Responsive design

**Usage:**
```tsx
import FamilyTree from '@/components/tree/FamilyTree';

<FamilyTree
  persons={persons}
  relationships={relationships}
  rootPersonId="person-id"
  locale="ar"
  onPersonClick={(person) => console.log(person)}
  onPersonDoubleClick={(person) => console.log(person)}
/>
```

### 2. **PersonNode.tsx** - Individual Person Node
Renders a single person in the tree with photo, name, dates, and location.

**Features:**
- Photo or avatar with initials
- Full name with patronymic chain
- Birth/death dates display
- Gender color coding (blue for male, pink for female)
- Hover tooltip with detailed information
- Living indicator (pulsing green dot)
- Children count badge
- Compact mode for zoomed-out view

**Props:**
- `node`: TreeNode - The person data and position
- `isSelected`: boolean - Whether this node is selected
- `isHighlighted`: boolean - Whether this node is highlighted (search result)
- `locale`: 'ar' | 'en' - Language preference
- `onClick`: Handler for click events
- `onDoubleClick`: Handler for double-click events
- `showPhotos`: boolean - Show/hide photos
- `showDates`: boolean - Show/hide dates
- `showPatronymic`: boolean - Show/hide patronymic chain

### 3. **ConnectionLine.tsx** - Relationship Lines
Renders lines connecting family members.

**Features:**
- Parent-child connections (vertical curved lines)
- Spouse connections (horizontal straight lines)
- Marriage indicator (heart icon)
- Divorce indicator (X icon with dashed line)
- Different colors for different relationship types
- Hover highlighting

**Line Types:**
- `parent-child`: Gray solid line connecting parent to child
- `spouse`: Green solid line for married couples, red dashed for divorced
- `sibling`: Optional sibling connections (not yet implemented)

### 4. **TreeControls.tsx** - Control Panel
Provides UI controls for tree navigation and manipulation.

**Features:**
- Zoom in/out buttons with percentage display
- Fit view (auto-scale to viewport)
- Reset view (back to initial state)
- Layout type selector (descendants, ancestors, hourglass, full)
- Search bar with live results
- RTL/LTR direction toggle
- Export menu (PNG, JPEG, SVG, PDF)

**Controls:**
- **Zoom**: +/- buttons or mouse wheel
- **Pan**: Click and drag
- **Search**: Type to find people by name
- **Layout**: Switch between different tree views
- **Export**: Download tree as image

### 5. **TreeLegend.tsx** - Symbol Legend
Explains the symbols, colors, and interactions used in the tree.

**Features:**
- Expandable/collapsible panel
- Color coding explanation
- Connection types
- Node indicators
- Interaction guide
- Arabic naming convention explanation

**Sections:**
- Gender colors (blue/pink/gray)
- Connection types (parent-child, marriage, divorce)
- Indicators (living, children count, selection, highlight)
- Information display (dates, location, photos)
- Interactions (click, double-click, drag, scroll)
- Arabic naming convention (for Arabic locale)

### 6. **useTreeLayout.ts** - Layout Hook
Custom React hook for calculating tree node positions.

**Features:**
- Hierarchical tree layout algorithm (modified Walker's algorithm)
- Handles multiple spouses
- RTL/LTR layout support
- Configurable spacing and dimensions
- Subtree width calculations
- Connection line path generation
- Bounding box calculation

**Usage:**
```tsx
import { useTreeLayout } from '@/hooks/useTreeLayout';

const layout = useTreeLayout(
  { persons, relationships, rootPersonId },
  {
    layoutType: 'descendants',
    direction: 'rtl',
    nodeWidth: 200,
    nodeHeight: 120,
    horizontalSpacing: 60,
    verticalSpacing: 100,
  }
);
```

### 7. **tree.ts** - TypeScript Types
Comprehensive type definitions for the tree visualization.

**Key Types:**
- `TreeNode`: Person node with position and relationships
- `TreeLayout`: Complete tree layout with nodes and connections
- `TreeLayoutConfig`: Configuration for layout calculation
- `TreeViewState`: UI state (zoom, selection, etc.)
- `ConnectionLine`: Line connecting two nodes
- `SpouseInfo`: Spouse relationship data

## File Structure

```
src/
├── components/
│   └── tree/
│       ├── FamilyTree.tsx          # Main tree component
│       ├── PersonNode.tsx          # Individual person node
│       ├── ConnectionLine.tsx      # Relationship lines
│       ├── TreeControls.tsx        # Control panel
│       ├── TreeLegend.tsx          # Legend panel
│       ├── FamilyTreeExample.tsx   # Usage example
│       ├── index.ts                # Exports
│       └── README.md               # This file
├── hooks/
│   └── useTreeLayout.ts            # Layout calculation hook
└── types/
    └── tree.ts                     # TypeScript types
```

## Features in Detail

### Pan and Zoom
- **Pan**: Click and drag anywhere on the tree background
- **Zoom**: Use mouse wheel, or +/- buttons
- **Fit View**: Automatically scale tree to fit viewport
- **Reset**: Return to initial zoom and position

### Layout Modes
1. **Descendants**: Shows person and all their descendants (children, grandchildren, etc.)
2. **Ancestors**: Shows person and all their ancestors (parents, grandparents, etc.)
3. **Hourglass**: Shows both ancestors above and descendants below
4. **Full**: Shows the entire tree

### Search
- Type in the search box to find people
- Matches against given name, full name (Arabic/English), and family name
- Results are highlighted in the tree
- Click a result to select and center on that person

### Export
- **PNG**: Raster image, good for sharing
- **JPEG**: Compressed image, smaller file size
- **SVG**: Vector image, scalable without quality loss
- **PDF**: Ready for printing (converted from SVG)

### RTL Support
- Automatically uses RTL layout for Arabic locale
- Ancestors appear on the right, descendants on the left
- All text and UI elements respect direction
- Toggle between RTL/LTR with direction button

### Arabic Name Support
- Displays full Arabic names with patronymic chain
- Example: "محمد بن أحمد بن علي الفلاني"
- Supports both Arabic and English transliterations
- Patronymic chain can be shown/hidden based on zoom level

### Gender Indication
- Male: Blue border and icon
- Female: Pink border and icon
- Unknown: Gray border and icon
- Color bar at top of each node

### Living Indicator
- Pulsing green dot for living people
- No indicator for deceased

### Marriage/Divorce
- Green line with heart icon for married couples
- Red dashed line with X icon for divorced couples
- Marriage date shown on relationship

### Responsive Design
- Adapts to different screen sizes
- Touch-friendly controls
- Compact node mode for zoomed-out view
- Information visibility based on zoom level

## Customization

### Styling
The components use Tailwind CSS for styling. Colors are defined in `tailwind.config.ts`:
- Primary: Emerald green (#10b981)
- Secondary: Teal (#14b8a6)
- Male: Blue (#3b82f6)
- Female: Pink (#ec4899)

### Spacing Configuration
Adjust spacing in `useTreeLayout` hook:
```tsx
const config = {
  nodeWidth: 200,        // Width of each person box
  nodeHeight: 120,       // Height of each person box
  horizontalSpacing: 60, // Space between siblings
  verticalSpacing: 100,  // Space between generations
  spouseSpacing: 40,     // Space between spouses
};
```

### Node Content
Customize what's shown on each node:
- `showPhotos`: Display photos or avatar
- `showDates`: Display birth/death dates
- `showPatronymic`: Display patronymic chain

### Colors
Override colors by modifying:
- Gender colors in PersonNode component
- Connection line colors in ConnectionLine component
- UI theme colors in TreeControls and TreeLegend

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- SVG support required
- Touch events for mobile devices
- Mouse wheel for zoom

## Performance
- Efficient layout algorithm (O(n) where n = number of people)
- Compact mode automatically activates for large trees
- Virtual rendering could be added for trees with 1000+ people
- Export quality scales with tree size

## Accessibility
- Keyboard navigation (future enhancement)
- Screen reader support (future enhancement)
- High contrast mode support
- Touch-friendly controls
- Clear visual indicators

## Future Enhancements
- [ ] Keyboard navigation
- [ ] Collapse/expand subtrees
- [ ] Minimap for large trees
- [ ] Timeline view
- [ ] Print-optimized layout
- [ ] Animation transitions
- [ ] Virtual scrolling for huge trees
- [ ] Custom node templates
- [ ] More layout algorithms
- [ ] Sibling connections
- [ ] Adoption/step relationships

## Credits
Created for the Shajara Arabic Family Tree application.
Uses modified Walker's algorithm for tree layout.

## License
Part of the Shajara application - see main LICENSE file.
