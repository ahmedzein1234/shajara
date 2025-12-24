# Shajara UI Component Library

This document provides an overview of all UI components created for the Shajara Arabic family tree application.

## Table of Contents

1. [Utilities](#utilities)
2. [UI Components](#ui-components)
3. [Layout Components](#layout-components)
4. [Usage Examples](#usage-examples)

---

## Utilities

### `src/lib/utils.ts`

Core utility functions for the application:

- **`cn(...inputs)`** - Merges className values with Tailwind CSS deduplication using clsx and tailwind-merge
- **`formatArabicName(firstName, patronymicChain, locale)`** - Formats Arabic names with patronymic chains (e.g., "محمد بن أحمد بن علي")
- **`formatDate(date, locale, options)`** - Formats dates in Arabic/English using Intl.DateTimeFormat
- **`formatHijriDate(date, locale)`** - Formats dates using the Islamic Hijri calendar
- **`truncate(text, maxLength)`** - Truncates text with ellipsis
- **`debounce(func, wait)`** - Debounces function calls for performance
- **`getInitials(name)`** - Extracts initials from a name (max 2 characters)
- **`isArabicText(text)`** - Validates if text contains Arabic characters
- **`generateAvatarColor(seed)`** - Generates consistent avatar colors based on seed string

---

## UI Components

### 1. Button (`src/components/ui/button.tsx`)

A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean - Shows loading spinner
- `leftIcon`: ReactNode - Icon on the left (RTL-aware)
- `rightIcon`: ReactNode - Icon on the right (RTL-aware)
- `fullWidth`: boolean - Expands to full width

**Example:**
```tsx
<Button variant="primary" size="md" leftIcon={<Plus />}>
  إضافة عضو
</Button>
```

### 2. Input (`src/components/ui/input.tsx`)

Input and Textarea components with labels, error states, and RTL support.

**Components:**
- `Input` - Single-line text input
- `Textarea` - Multi-line text input

**Props:**
- `label`: string - Input label
- `error`: string - Error message
- `helperText`: string - Helper text below input
- `leftIcon`: ReactNode - Icon on the left
- `rightIcon`: ReactNode - Icon on the right
- `fullWidth`: boolean - Expands to full width

**Example:**
```tsx
<Input
  label="الاسم الأول"
  placeholder="أدخل الاسم"
  error={errors.name}
  required
/>
```

### 3. Card (`src/components/ui/card.tsx`)

Card container components for content organization.

**Components:**
- `Card` - Main container
- `CardHeader` - Header section with border
- `CardTitle` - Title heading
- `CardDescription` - Subtitle/description
- `CardContent` - Main content area
- `CardFooter` - Footer section with border

**Props:**
- `variant`: 'default' | 'bordered' | 'elevated'
- `padding`: 'none' | 'sm' | 'md' | 'lg'

**Example:**
```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>معلومات الشخص</CardTitle>
    <CardDescription>التفاصيل الأساسية</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### 4. Avatar (`src/components/ui/avatar.tsx`)

Avatar component for displaying user photos with fallbacks.

**Components:**
- `Avatar` - Single avatar
- `AvatarGroup` - Group of overlapping avatars

**Props:**
- `src`: string - Image URL
- `alt`: string - Alt text
- `fallback`: string - Fallback text for initials
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
- `variant`: 'circle' | 'square'
- `status`: 'online' | 'offline' | 'away' | 'busy' | null

**Example:**
```tsx
<Avatar
  src="/avatar.jpg"
  fallback="محمد أحمد"
  size="md"
  status="online"
/>

<AvatarGroup max={3}>
  <Avatar fallback="User 1" />
  <Avatar fallback="User 2" />
  <Avatar fallback="User 3" />
  <Avatar fallback="User 4" />
</AvatarGroup>
```

### 5. Modal (`src/components/ui/modal.tsx`)

Dialog/Modal component with accessibility features.

**Components:**
- `Modal` - Main modal container
- `ModalHeader` - Header section
- `ModalTitle` - Title heading
- `ModalDescription` - Description text
- `ModalContent` - Main content area
- `ModalFooter` - Footer with action buttons

**Props:**
- `open`: boolean - Controls visibility
- `onClose`: () => void - Close handler
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closeOnOverlayClick`: boolean - Default: true
- `closeOnEscape`: boolean - Default: true
- `showCloseButton`: boolean - Default: true

**Features:**
- Focus trap
- Escape key handling
- Body scroll lock
- Overlay backdrop

**Example:**
```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} size="md">
  <ModalHeader>
    <ModalTitle>إضافة عضو جديد</ModalTitle>
    <ModalDescription>أدخل معلومات العضو</ModalDescription>
  </ModalHeader>
  <ModalContent>
    {/* Form fields */}
  </ModalContent>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      إلغاء
    </Button>
    <Button variant="primary">حفظ</Button>
  </ModalFooter>
</Modal>
```

### 6. Dropdown (`src/components/ui/dropdown.tsx`)

Dropdown menu and Select components.

**Components:**
- `Dropdown` - Dropdown menu container
- `DropdownItem` - Menu item
- `DropdownSeparator` - Visual separator
- `DropdownLabel` - Section label
- `Select` - Native select dropdown

**Props (Dropdown):**
- `trigger`: ReactNode - Element that opens dropdown
- `align`: 'start' | 'center' | 'end'
- `side`: 'top' | 'bottom'

**Props (DropdownItem):**
- `icon`: ReactNode - Icon
- `destructive`: boolean - Red styling
- `selected`: boolean - Shows checkmark

**Example:**
```tsx
<Dropdown
  trigger={<Button variant="outline">القائمة</Button>}
  align="start"
>
  <DropdownLabel>الإجراءات</DropdownLabel>
  <DropdownItem icon={<Edit />}>تعديل</DropdownItem>
  <DropdownItem icon={<Share />}>مشاركة</DropdownItem>
  <DropdownSeparator />
  <DropdownItem icon={<Trash />} destructive>
    حذف
  </DropdownItem>
</Dropdown>

<Select
  label="الجنس"
  options={[
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' }
  ]}
  required
/>
```

### 7. Tabs (`src/components/ui/tabs.tsx`)

Tab navigation component with horizontal/vertical layouts.

**Components:**
- `Tabs` - Container with state management
- `TabsList` - Tab button container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Content panel for each tab

**Props (Tabs):**
- `defaultValue`: string - Initial active tab
- `value`: string - Controlled active tab
- `onValueChange`: (value) => void - Change handler
- `orientation`: 'horizontal' | 'vertical'

**Example:**
```tsx
<Tabs defaultValue="info" orientation="horizontal">
  <TabsList>
    <TabsTrigger value="info" icon={<User />}>
      المعلومات
    </TabsTrigger>
    <TabsTrigger value="family" icon={<Users />}>
      العائلة
    </TabsTrigger>
    <TabsTrigger value="events" icon={<Calendar />}>
      الأحداث
    </TabsTrigger>
  </TabsList>

  <TabsContent value="info">
    {/* Info content */}
  </TabsContent>
  <TabsContent value="family">
    {/* Family content */}
  </TabsContent>
  <TabsContent value="events">
    {/* Events content */}
  </TabsContent>
</Tabs>
```

---

## Layout Components

### 1. Header (`src/components/layout/header.tsx`)

Application header with navigation, theme toggle, and user menu.

**Features:**
- Logo and branding
- Desktop navigation menu
- Mobile hamburger menu
- Theme toggle (light/dark)
- Language switcher (AR/EN)
- User dropdown menu
- Responsive design

**Props:**
- `onMenuToggle`: () => void - Mobile menu toggle handler

**Example:**
```tsx
<Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
```

### 2. Sidebar (`src/components/layout/sidebar.tsx`)

Collapsible sidebar navigation with mobile support.

**Components:**
- `Sidebar` - Desktop sidebar
- `MobileSidebar` - Mobile drawer sidebar

**Features:**
- Collapsible (icon-only mode)
- Active route highlighting
- Quick action button
- Settings link in footer
- RTL support

**Props:**
- `onClose`: () => void - Close handler (mobile)

**Example:**
```tsx
{/* Desktop */}
<Sidebar />

{/* Mobile */}
<MobileSidebar
  open={isSidebarOpen}
  onClose={() => setIsSidebarOpen(false)}
/>
```

### 3. Footer (`src/components/layout/footer.tsx`)

Application footer with links and information.

**Features:**
- Brand section with logo
- Social media links (GitHub, Twitter, Email)
- Product, Company, and Legal link sections
- Language selector
- Copyright notice
- Fully responsive

**Example:**
```tsx
<Footer />
```

---

## Usage Examples

### Complete Page Layout

```tsx
import { Header, Sidebar, Footer } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function PageLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        <Sidebar />
        <MobileSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
```

### Form with Modal

```tsx
import { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
  Button,
  Input,
  Select
} from '@/components/ui';

export function AddPersonModal() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({});

  return (
    <>
      <Button onClick={() => setOpen(true)}>إضافة عضو</Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalHeader>
          <ModalTitle>إضافة عضو جديد</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <Input
              label="الاسم الأول"
              placeholder="أدخل الاسم"
              required
            />
            <Select
              label="الجنس"
              options={[
                { value: 'male', label: 'ذكر' },
                { value: 'female', label: 'أنثى' }
              ]}
              required
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button variant="primary">حفظ</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

---

## Design Features

All components include:

- **RTL Support**: Logical properties (start/end) for proper right-to-left layout
- **Dark Mode**: Full dark mode support with Tailwind's dark: variant
- **Accessibility**: ARIA attributes, keyboard navigation, focus management
- **Responsive**: Mobile-first responsive design
- **Icons**: Integration with lucide-react icons
- **Translations**: next-intl integration for Arabic/English
- **TypeScript**: Full type safety with TypeScript

---

## Import Paths

```tsx
// Utilities
import { cn, formatArabicName, formatDate } from '@/lib/utils';

// UI Components (individual)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// UI Components (barrel export)
import { Button, Input, Card, Avatar } from '@/components/ui';

// Layout Components (individual)
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Footer } from '@/components/layout/footer';

// Layout Components (barrel export)
import { Header, Sidebar, Footer } from '@/components/layout';
```

---

## Notes

1. All components use Tailwind CSS logical properties for RTL support
2. Components are client-side ('use client') where needed for interactivity
3. All interactive components include proper focus styles and keyboard navigation
4. Colors use the emerald theme (emerald-600 primary color)
5. Dark mode uses slate color palette for backgrounds and text
