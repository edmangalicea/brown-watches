import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="auth-page">
        <div className="config-card">
          <h2>Clerk is not configured yet</h2>
          <p>Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and the rest of the Clerk keys to enable hosted sign-in.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <SignIn />
    </main>
  );
}
