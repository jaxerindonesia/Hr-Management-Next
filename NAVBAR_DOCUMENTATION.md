# Navbar Components Documentation

This HR Management application uses **two separate navbar systems** optimized for different device types.

---

## 📱 Mobile Navbar (`MobileNavbar.tsx`)

**Visibility:** Only on mobile devices (screens < 1024px)

### Components:

#### 1. **Fixed Top Bar**
- **Position:** Top of screen, fixed
- **Contents:**
  - Company logo (left side)
  - Theme toggle button (light/dark mode)
  - Hamburger menu icon
- **Height:** 56px (3.5rem)

#### 2. **Slide-in Menu**
- **Position:** Slides from right side
- **Trigger:** Hamburger menu button
- **Contents:**
  - Dashboard
  - Data Karyawan
  - Ketidakhadiran
  - Payroll
  - Penilaian Kinerja
  - Logout button (at bottom)
- **Features:**
  - Backdrop overlay (closes on click)
  - Body scroll lock when open
  - Smooth slide animation
  - Custom scrollbar

#### 3. **Bottom Navigation Bar**
- **Position:** Bottom of screen, fixed
- **Contents:** 5 quick-access icons with labels
  - Home (Dashboard)
  - Karyawan (Employees)
  - Cuti (Leaves)
  - Payroll
  - Kinerja (Performance)
- **Height:** ~60px
- **Features:**
  - Active state highlighting
  - Icon + label combination
  - Thumb-friendly spacing

### Mobile Layout Spacing:
```
Top: 56px padding (for top navbar)
Bottom: 80px padding (for bottom nav bar)
```

---

## 💻 Desktop Navbar (`DesktopNavbar.tsx`)

**Visibility:** Only on desktop/laptop (screens ≥ 1024px)

### Components:

#### 1. **Fixed Top Navbar**
- **Position:** Top of main content area (next to sidebar), sticky
- **Layout:** Horizontal bar with left and right sections

**Left Section:**
- Page title (dynamic based on current route)
- Current date (formatted in Indonesian)

**Right Section:**
- Theme toggle button (Sun/Moon icon)
- Notifications bell (with badge indicator)
- Divider line
- User profile section:
  - Avatar icon
  - User name ("Admin User")
  - Role ("Administrator")
  - Dropdown chevron

### Features:
- Sticky positioning (stays visible when scrolling)
- Dynamic page title updates
- Real-time date display
- Notification badge indicator
- Hover effects on all interactive elements
- Dark mode support

---

## 🎨 Sidebar (`Sidebar.tsx`)

**Visibility:** Only on desktop/laptop (screens ≥ 1024px)

### Features:
- Collapsible/expandable design
- Company logo at top
- Navigation menu items with icons
- Submenu support for "Pengajuan Ketidakhadiran"
- Theme toggle at bottom
- Logout button at bottom
- Logout confirmation modal
- Tooltips when collapsed

---

## 📐 Layout Structure

### Mobile Layout (< 1024px):
```
┌─────────────────────────┐
│   Mobile Top Navbar     │ ← Fixed top
├─────────────────────────┤
│                         │
│   Main Content Area     │ ← Scrollable
│   (with padding)        │
│                         │
├─────────────────────────┤
│  Bottom Navigation Bar  │ ← Fixed bottom
└─────────────────────────┘
```

### Desktop Layout (≥ 1024px):
```
┌────────┬────────────────────────┐
│        │   Desktop Navbar       │ ← Sticky
│ Side   ├────────────────────────┤
│ bar    │                        │
│        │   Main Content Area    │ ← Scrollable
│        │                        │
│        ├────────────────────────┤
│        │   Footer               │
└────────┴────────────────────────┘
```

---

## 🎯 Responsive Breakpoints

| Breakpoint | Components Visible |
|------------|-------------------|
| < 1024px (Mobile/Tablet) | MobileNavbar (top + bottom) |
| ≥ 1024px (Desktop/Laptop) | Sidebar + DesktopNavbar |

---

## 🔧 Implementation Details

### Files:
- `components/MobileNavbar.tsx` - Mobile navigation system
- `components/DesktopNavbar.tsx` - Desktop top navbar
- `components/Sidebar.tsx` - Desktop sidebar (existing)
- `app/(dashboard)/layout.tsx` - Layout integration
- `app/globals.css` - Responsive styles and animations

### Key CSS Classes:
```css
/* Mobile menu scroll lock */
.mobile-menu-open { overflow: hidden; }

/* Mobile menu animation */
.mobile-menu-slide { animation: slideInRight 0.3s ease-out; }

/* Custom scrollbar */
.mobile-menu-scroll::-webkit-scrollbar { width: 4px; }
```

### Responsive Utilities:
- `lg:hidden` - Hide on desktop (≥ 1024px)
- `lg:block` - Show on desktop (≥ 1024px)
- `hidden lg:block` - Desktop only
- Mobile-first approach with Tailwind CSS

---

## ✨ Features Summary

### Mobile:
✅ Top navbar with logo and theme toggle  
✅ Hamburger menu with slide-in navigation  
✅ Bottom tab bar for quick access  
✅ Body scroll lock when menu is open  
✅ Touch-optimized button sizes  
✅ Active state indicators  

### Desktop:
✅ Traditional sidebar navigation  
✅ Top navbar with page title and date  
✅ User profile section  
✅ Notifications bell with badge  
✅ Theme toggle in both sidebar and navbar  
✅ Sticky navbar (follows scroll)  

---

## 🚀 Usage

The navbar components are automatically integrated in the dashboard layout. No additional configuration needed!

Both components:
- Support dark mode
- Have smooth animations
- Include active state highlighting
- Work with the existing routing system
- Handle authentication (logout functionality)

---

## 📝 Notes

- The sidebar already existed and has been preserved for desktop use
- Mobile navbar replaces the sidebar completely on small screens
- Theme toggle appears in multiple locations for convenience
- All components use the same ThemeContext for consistency
- Logout functionality is available in both mobile menu and desktop sidebar
