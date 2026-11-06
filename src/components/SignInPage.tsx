import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';
import { Wordmark } from './Header';

/** Same frame as the app: header on a hairline, then the page. */
export const SignInPage = ({ error }: { error: string | null }) => {
  const { signIn, signInAsStaff } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex h-14 items-center border-b border-line px-4 md:px-8">
        <Wordmark />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-[18vh]">
        <div className="w-full max-w-sm">
          <h1 className="text-display">Sign in</h1>
          <p className="mt-3 text-ink-2">See what’s been turned in at Northwestern’s lost and found desks.</p>
          <Button variant="primary" onClick={signIn} className="mt-8 h-11 w-full">
            Sign in with Google
          </Button>
          <p role={error ? 'alert' : undefined} className={`mt-3 text-small ${error ? 'text-danger' : 'text-ink-3'}`}>
            {error ?? 'Use your @u.northwestern.edu or @northwestern.edu account.'}
          </p>
          {/* Pulled left so the label, not the hover box, lines up with the text above. */}
          <Button variant="quiet" size="sm" onClick={signInAsStaff} className="mt-8 -ml-3">
            Staff sign in
          </Button>
        </div>
      </main>
    </div>
  );
};
