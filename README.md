![](https://me.smenet.org/wp-content/uploads/sites/3/2024/11/utepwp.jpg)

# Campus Booking System

The Campus Booking System enables the reservation and management of study rooms, classrooms, labs, and equipment for students, faculty members, and administrators at The University of Texas at El Paso.

# Developer Setup

Clone the repository and install the required dependencies.

```bash
npm install
```

### Node version error?

If `npm install` fails due to a Firebase package issue, make sure you're using Node version >= 24.12.0. You can use node version manager for simplicity.

### Required Developer Service Account Key

Server-side access to the Firestore database uses a Firestore service account, which can be placed as a JSON
file at `src/lib/server/serviceAccountKey.json`. This JSON file can be obtained from Firebase and will have a form similar to the following, with empty string replaced by their real fields:

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

---

### Building for Production

Build the application for production

```
npm run build
```
