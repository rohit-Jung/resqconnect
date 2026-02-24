import { redirect } from 'next/navigation';

export default function Home() {
  const isAuthenticated = false;

  if (isAuthenticated) {
    redirect('/login');
  } else {
    redirect('/dashboard');
  }

  return <div>Hello</div>;
}
