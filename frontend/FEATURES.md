# Examshala Features Guide

## Component Library

### Navigation Components

#### Navbar
- Logo with link to home
- Navigation links (Home, Sign In, Sign Up)
- Responsive design
- Used on: Landing page

#### DashboardSidebar
- Dashboard navigation menu
- Active route highlighting
- Links: Dashboard, Tests, Results
- Logout button
- Used on: Dashboard, Tests, Results pages

#### Footer
- Company information
- Quick links section
- Contact information
- Copyright notice
- Used on: Landing page

### Display Components

#### HeroSection
- Large headline
- Descriptive text
- Call-to-action buttons
- Gradient background
- Used on: Landing page

#### FeatureCard
- Icon display
- Feature title
- Feature description
- Hover effects
- Used on: Landing page

#### TestCard
- Test title
- Duration and question count
- Start test button
- Shadow and hover effects
- Used on: Tests list page

#### QuestionCard
- Question number and text
- Radio button options
- Selected state highlighting
- Interactive option selection
- Used on: Test attempt page

#### ResultCard
- Test name
- Score with percentage
- Correct/wrong answer counts
- Attempt date
- Color-coded sections
- Used on: Results page

#### Timer
- Countdown display (MM:SS)
- Color changes when time is low
- Auto-submit on time up
- Used on: Test attempt page

## Page Flows

### User Journey 1: New User Registration
1. Landing page → Click "Get Started"
2. Sign up page → Fill form (name, username, password)
3. Dashboard → View statistics and recent activity

### User Journey 2: Taking a Test
1. Sign in → Dashboard
2. Navigate to Tests page
3. Click "Start Test" on any test card
4. Answer questions with timer running
5. Navigate between questions
6. Submit test
7. View results

### User Journey 3: Creating a Test
1. Dashboard → Click "Create New Test"
2. Fill test details (title, duration)
3. Add questions with options
4. Select correct answers
5. Submit to create test

## Form Behaviors

All forms currently use console.log for data output:

### Sign In Form
```javascript
console.log('Sign in data:', { username, password });
```

### Sign Up Form
```javascript
console.log('Sign up data:', { name, username, password });
```

### Create Test Form
```javascript
console.log('Test created:', { testTitle, duration, questions });
```

### Test Submission
```javascript
console.log('Test submitted:', answers);
```

## Styling Patterns

### Color Scheme
- Primary: Blue (#2563eb - blue-600)
- Success: Green (#16a34a - green-600)
- Background: Gray (#f9fafb - gray-50)
- Text: Gray-900 for headings, Gray-600 for body

### Common Patterns
- Cards: `bg-white p-6 rounded-lg shadow-md`
- Buttons: `px-6 py-3 rounded-lg hover:bg-*-700`
- Inputs: `px-4 py-2 border rounded-lg focus:ring-2`
- Containers: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

### Responsive Grid Layouts
- Features: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Tests: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Stats: `grid-cols-1 md:grid-cols-3`

## Interactive Features

### Timer Component
- Starts countdown from test duration
- Updates every second
- Changes color to red when < 5 minutes
- Calls onTimeUp callback when finished

### Question Navigation
- Previous/Next buttons
- Direct question selection via number buttons
- Visual indicators for answered questions
- Current question highlighting

### Form Validation
- All inputs marked as required
- Browser native validation
- Placeholder text for guidance

## Mock Data

### Dashboard Stats
- Tests Created: 12
- Tests Taken: 45
- Average Score: 78%

### Sample Tests
1. Mathematics Quiz (30 min, 20 questions)
2. Science Test (45 min, 30 questions)
3. History Exam (60 min, 40 questions)
4. English Grammar (25 min, 15 questions)
5. Physics Challenge (50 min, 25 questions)
6. Chemistry Basics (40 min, 20 questions)

### Sample Results
1. Mathematics Quiz: 18/20 (90%)
2. Science Test: 25/30 (83.3%)
3. History Exam: 32/40 (80%)

## Backend Integration Points

Ready for API integration at:

1. `/api/auth/signin` - User authentication
2. `/api/auth/signup` - User registration
3. `/api/tests` - GET all tests, POST create test
4. `/api/tests/[id]` - GET test details
5. `/api/tests/[id]/submit` - POST test answers
6. `/api/results` - GET user results
7. `/api/dashboard/stats` - GET user statistics

## Accessibility Features

- Semantic HTML elements
- Form labels properly associated
- Keyboard navigation support
- Focus states on interactive elements
- Sufficient color contrast
- Responsive text sizing
