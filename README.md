# chat-app-graphql-prisma-server

Clone this repository with this command

```jsx
git clone https://github.com/sonnguyenhong/chat-app-graphql-prisma-server.git
```

Open project folder in terminal and install all dependencies by running this command

```jsx
npm install
```

Create environment file .env in the root folder and specify DATABASE_URL, SECRET_KEY and EXPIRE_TIME

Run the following command to update database in the local database

```jsx
npx prisma db push
```

Run the following command to generate prisma client

```jsx
npx prisma generate
```

Start the server in development environment by running the following command

```jsx
npm run dev
```
