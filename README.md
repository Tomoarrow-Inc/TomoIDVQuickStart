# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Environment Configuration

This project supports three environments with internal configuration management:

### Environment Types

1. **Development** (`REACT_APP_ENV=development`)
   - Uses internal configuration in `ClientEnv.tsx`
   - HTTP endpoints allowed
   - Local development settings

2. **Test** (`REACT_APP_ENV=test`)
   - Uses internal configuration in `ClientEnv.tsx`
   - HTTPS endpoints required
   - Test environment settings

3. **Production** (`REACT_APP_ENV` not set or any other value)
   - Uses internal configuration in `ClientEnv.tsx`
   - HTTPS endpoints required
   - Production environment settings

### Running in Different Environments

#### Development Environment
```bash
# Using npm script
npm run start:dev

# Using environment variable
REACT_APP_ENV=development npm start

# Using Docker
docker-compose up  # Uses .env by default
```

#### Test Environment
```bash
# Using npm script
npm run start:test

# Using environment variable
REACT_APP_ENV=test npm start

# Using Docker (modify docker-compose.yaml)
# Change env_file to: - .env
```

#### Production Environment
```bash
# Using npm script (no REACT_APP_ENV set)
npm run start:prod

# Using Docker (modify docker-compose.yaml)
# Change env_file to: - .env
```

### Docker Configuration

Edit `docker-compose.yaml` to switch environments:

```yaml
env_file:
  # development, test, production in .env file
  - .env
```

### Environment Files

The project includes environment-specific files for Docker deployment:

- `.env` - Sets `REACT_APP_ENV=development`
- `.env` - Sets `REACT_APP_ENV=test`  
- `.env` - No `REACT_APP_ENV` set (defaults to production)

**Note**: For npm users, no environment files are required. The application will default to production mode unless `REACT_APP_ENV` is explicitly set.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
