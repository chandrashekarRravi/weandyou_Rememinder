I am building a company-level Calendar + Event Tracking Dashboard based on my final wireframe.

Tech:
- React (Vite)
- JavaScript (typescript)
- Tailwind CSS
- Node + Express + MongoDB
- Socket.io for real-time reminders

This is not a simple calendar. It must behave like a SaaS dashboard.

-----------------------------------------
MAIN PAGE: MONTH VIEW
-----------------------------------------
title is rememinder
1. Header:
- Month dropdown  in horizantal 
- Previous / Next month arrows
- Week shifting inside month
- Smooth transitions

2. Sidebar:
- Filters:
    - Special Days (orange )
    - Engagement (light brown gray )
    - Ideation (green light)
    - (Pending / Ongoing / Completed) it should  fliter events 
- Highlight active filter
- Show event counts

3. Calendar Grid:
- 7 columns (Sun–Sat)
- Show correct dates
- Highlight today
- Show small event badges
- Status badge (Pending / Ongoing / Completed)

- Limit 3 visible events
- "+X more" overflow

4. Clicking a Date:
- Navigate to DayDetailsPage
- Show all events for that day

-----------------------------------------
DAY DETAILS PAGE
-----------------------------------------

1. Back button
2. Display event cards (E1, E2 etc)
3. Each card shows:
    - Title
    - description (detaisl )
    - client nsame  
    - client  brnad
    - Time
    - Date
    - poster
    - Category
    - Status badge (Pending / Ongoing / Completed)
    - Edit button
    - Mark as completed

4. Real-Time:
- If event becomes ongoing (time reached)
  automatically update status via socket
- If reminder triggers → show toast

-----------------------------------------
ARCHITECTURE REQUIREMENTS
-----------------------------------------

- Use custom hook useCalendar for month + week logic
- Memoize DayCell to avoid full re-render
- Use Context for global socket
- Keep UI and business logic separate
- Prepare scalable structure

-----------------------------------------
PERFORMANCE
-----------------------------------------

- Efficient date calculations
- Avoid unnecessary re-renders
- Clean state normalization
- Ready for large data

-----------------------------------------
DESIGN STYLE
-----------------------------------------

- Modern SaaS dashboard
- Rounded cards
- Soft shadows
- Clean typography
- Responsive layout

Build step-by-step and explain reasoning.
Do not oversimplify.
