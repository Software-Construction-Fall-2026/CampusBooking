![](https://me.smenet.org/wp-content/uploads/sites/3/2024/11/utepwp.jpg)

# Campus Booking System

The Campus Booking System enables the reservation and management of study rooms, classrooms, labs, and equipment for students, faculty members, and administrators at The University of Texas at El Paso.

# Running Campus Booking

## 1. Install Node 24

The project needs Node **24.12.0 or newer**. Our `.nvmrc` file pins this version to 24.22.2.

```
nvm install
nvm use
```

Check that you installed the correct version using `node -v`.

## 2. Get the code and install dependencies

```bash
git clone <repo-url>
cd CampusBooking
npm install
```

If `npm install` fails due to a Firebase package issue, make sure you're using Node version 24.22.2. You can use node version manager for simplicity.

## 3. Add the Firebase service account key

The app reads and writes Firestore from the server using a service account key.
The key is not in the repo, and is actually ignored by `.gitignore` since it contains private information.

You can ask a teammate for the `serviceAccountKey.json` file or download a new
one from Firebase. Simply navigate to the Firebase console, go to the campus booking project, project settings, and finally service accounts. There, you
can select **Generate new private key**. Make sure to rename it once you've downloaded it.

This JSON file will have a form similar to the following, with empty strings replaced by their real fields:

```
{
  "type": "service_account",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": "",
  "universe_domain": "",
}
```

Save it exactly here:

```
src/lib/server/serviceAccountKey.json
```

Keep this file private and never share it publicly to the repository.

## 4. Start the app

```bash
npm run dev
```

# Developing

Start a local development server

```
npm run dev
```

### Formatting

Run linting and prettier formatting when you've finished coding to format your files.

```
npm run lint
npm run format
```

### Running Tests

The project contains various tests for classes in the system. You can run them using the following commands, one at a time for each type of test:

```
# runs unit tests
npm run test:unit

# runs integration tests
npm run test:integration
```

# Building for Production

Build the application for production. You do not need to do this when developing, only when we're deploying the website.

```
npm run build
```
