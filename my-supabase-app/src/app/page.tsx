// Ilya Zeldner
import { supabase } from "@/lib/supabase";
import { addEmail, deleteEmail } from "./actions";
import LikeButton from "@/components/LikeButton";
import { getLikes } from "./actions";


const TABLE_NAME = "Waitlist2026"; // Supabase Table Name

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
}



export default async function Page() {
  // Fetch Data and Count
  const likes = await getLikes();
  const { data: entries, count } = await supabase
    .from(TABLE_NAME)
    .select("*", { count: "exact" }) // Get exact count
    .order("created_at", { ascending: false });

  const waitlist = entries as WaitlistEntry[] | null;

  // The * (Star) : This represents "All Columns."
  // When we write .select('*'), we are telling Supabase: "I want every piece of information for each row." This includes the id, the email, and the created_at timestamp.
  // It is the standard way to fetch the full record of each student in your waitlist.
  // The count: 'exact'
  // This is a special instruction for the Database Engine. Usually, a database just returns the rows of data. However, by adding { count: 'exact' }, you are asking Supabase to perform two jobs at once:
  // 1.Fetch the rows (the list of emails).
  // 2. Calculate the total (the exact number of rows in the table).
  // This returns a separate variable called count. It is much faster to let the database count the rows in Frankfurt than to download thousands of emails and count them in your code using .length.

  return (
    <main className="max-w-xl mx-auto p-10 font-sans text-slate-900">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-10 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Waitlist 2026</h1>
          {/* Using 'count' here removes the "unused" warning */}
          <p className="text-sm text-slate-500 font-medium">
            Total Students: <span className="text-blue-600">{count ?? 0}</span>
          </p>
        </div>

        {/* PURE FRONT-END COMPONENT */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">
            Interactive
          </span>
          <LikeButton initialLikes={likes} />

        </div>
      </div>

      {/* INPUT FORM (Connects to actions.ts) */}
      <section className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-10 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          Add to Database
        </h2>
        <form action={addEmail} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="student@example.com"
            required
            className="p-3 rounded-lg border border-slate-300 text-black outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all active:scale-95"
          >
            Join Waitlist
          </button>
        </form>
      </section>

      {/* THE LIST (Fetched from Server) */}
      <section>
        <h3 className="text-xl font-bold mb-4 text-slate-800">
          Verified Entries
        </h3>
        <ul className="divide-y divide-slate-100 bg-white rounded-lg border border-slate-100 shadow-sm">
          {/* If waitlist exists, we map through it */}
          {waitlist && waitlist.length > 0 ? (
            waitlist.map((user) => (
              <li
                key={user.id}
                className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-700">{user.email}</span>
                <span className="text-xs text-slate-400 tabular-nums">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </li>
            ))
          ) : (
            <li className="p-10 text-center text-slate-400 italic">
              No students joined yet.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
