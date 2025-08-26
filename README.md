This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:m

```bash
npm run dev
# or
yarn deve
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Link Which use in development 

[text](https://www.hyperui.dev/)
[text](https://clerk.com/)
[text](https://resend.com/)
[text](https://vercel.com/)


My project is cloudsharing. first is landing page when click on getstart button it will be redirect to login page where user can create or login account For user login use firebase auth. after login user redirect to upload page where user can multiple files multi type of files at same time it will be uploading in. firebase database. after uploading it will be redirect to sending option page like where show file sharing option in this page first is qr code (qr code is unique link which created to qr code) , unique link for sharing , email (sending mail using nodemailer) sending, local file share (where if user in same network so user can share file easy. and it use Ably for realtime sharing ). after this there is files page where show files history which send by user here data will be fetch from firebase database. in this page user can show file, resend file, delete file. after deletetion file can not direct delete it move to recycle bin page and from recycle user can recover and delete file. then upgrade page where there is buy plan and use can select and buy plan and get benifets. there is meeting page where user can arrange meeting using jitsi meet(with basic meeting id which other user add and join meet ). then chat page where user can chating each other like proper chating website where all chats store in firebase and also it use firebase realtime chating feture so it will make easy. after admin page where admin can control user role, show premium users, active user , non active user, storage. there is an chat bot with gemini api integration and chat bot fully trained based on website so it acurate answer to user and give help.