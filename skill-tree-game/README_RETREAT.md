# Retreat Dashboard - Setup Instructions

This is a special restricted version of the Future Coding Academy dashboard designed for the retreat.

## Features

- **Password Protected**: Uses password `LLRETREAT!` to access
- **Limited Student Access**: Only allows access to 4 specific students:
  - tim
  - miles  
  - gus
  - sample_student
- **No Teacher Access**: Teacher dashboard and user creation are completely disabled
- **Identical UI**: Uses the same Civilization-themed dashboard as the main app

## How to Run

### Development Mode
```bash
npm run dev:retreat
```
This will start the development server with the retreat configuration.

### Build for Production
```bash
npm run build:retreat
```
This builds the retreat version for deployment.

## Access URLs

- **Development**: `http://localhost:5173` (when running `npm run dev:retreat`)
- **Main App**: Use `npm run dev` for the regular unrestricted version

## File Structure

### New Files Created:
- `retreat.html` - Entry point HTML for retreat version
- `src/retreat-main.jsx` - React entry point for retreat
- `src/RetreatApp.jsx` - Main retreat app component
- `src/components/Auth/RetreatAuthProvider.jsx` - Authentication for retreat
- `src/components/Auth/RetreatLoginForm.jsx` - Login form for retreat
- `src/components/Student/RetreatUserSelector.jsx` - Restricted user selector
- `src/components/Student/RetreatCivDashboard.jsx` - Dashboard restricted to allowed students

### Modified Files:
- `package.json` - Added retreat build scripts
- `vite.config.js` - Added retreat mode configuration

## Security Features

1. **Password Protection**: Requires `LLRETREAT!` password to access
2. **Student Filtering**: Only shows allowed students in selection screen
3. **Access Control**: Dashboard blocks access to non-allowed students
4. **No Admin Functions**: Completely removes teacher dashboard and user creation
5. **Separate Authentication**: Uses its own auth system independent of main app

## Deployment

The retreat version can be deployed separately from the main application:

1. Build: `npm run build:retreat`
2. Deploy the `dist` folder contents
3. Ensure `retreat.html` is served as the index file

## Notes

- The retreat dashboard is completely self-contained
- It shares the same Firebase backend but has restricted access
- All the same features (AI chat, messaging, gallery, etc.) work for allowed students
- The UI is identical to the main Civ dashboard but with retreat branding
