import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const session = await getSession();

  function LoggedIn() {
    return (
      <div className="space-y-3">
        <Button asChild variant="outline">
          <Link href="/time">track time</Link>
        </Button>

        <form>
          <Button
            variant="ghost"
            formAction={async () => {
              "use server";
              await auth.api.signOut({
                headers: await headers(),
              });
              redirect("/");
            }}
          >
            sign out
          </Button>
        </form>
      </div>
    );
  }

  function LoggedOut() {
    return (
      <form>
        <Button
          formAction={async () => {
            "use server";
            const res = await auth.api.signInSocial({
              body: {
                provider: "discord",
                callbackURL: "/time",
              },
            });
            redirect(res.url!);
          }}
        >
          sign in
        </Button>
      </form>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <h1 className="text-5xl font-light">willow</h1>
        <p className="text-muted-foreground">minimalist time management</p>
        {session ? <LoggedIn /> : <LoggedOut />}
      </div>
    </main>
  );
}
