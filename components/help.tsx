// "How this works" text for each section's ? button. Kept in one place so it's easy to edit.

export const HELP = {
  warChest: (
    <ul>
      <li>Your accounts (bank, e-wallet, payment gateway…) and what&apos;s in each right now.</li>
      <li>Press &ldquo;Update balances&rdquo; about once a week and type what each account really holds. In between, the app keeps the numbers moving for you.</li>
      <li>Money you collect is added to the account you pick. Bills and spending come out of the account you pick.</li>
      <li>Moved money between your own accounts? Use &ldquo;Move money&rdquo;. Your total doesn&apos;t change.</li>
      <li>Runway = how many months your cash lasts if income stopped today. The safety buffer is the cushion you aim to keep.</li>
      <li>&ldquo;Money moves&rdquo; lists everything since your last update. Wrong account? Change it right there.</li>
    </ul>
  ),
  briefing: (
    <ul>
      <li>Kit reads your numbers every day and tells you what matters most right now.</li>
      <li>Chat with Kit below: ask questions, or ask it to rewrite today&apos;s briefing or add quests. Voice on = Kit reads replies out loud.</li>
    </ul>
  ),
  quests: (
    <ul>
      <li>Today&apos;s to-do list. Some are suggested from your numbers; add your own too.</li>
      <li>Each quest done is +XP. Unfinished ones can be carried over to the next day.</li>
    </ul>
  ),
  bosses: (
    <ul>
      <li>Your biggest open deals. A boss&apos;s HP is the money still to collect.</li>
      <li>Manage them in Boss Deals.</li>
    </ul>
  ),
  achievements: (
    <ul>
      <li>Unlocked by hitting milestones (covering expenses, reaching your goal, streaks…).</li>
      <li>Each one gives your hero a piece of gear that stays for good.</li>
    </ul>
  ),
  week: (
    <ul>
      <li>Totals from your daily check-ins since Monday: leads, calls, show-ups, closes and ad spend.</li>
      <li>Check in every day to keep your streak and to make these numbers useful.</li>
    </ul>
  ),
  income: (
    <ul>
      <li>Your regular clients (retainers). Each shows what&apos;s due this month.</li>
      <li>When the money arrives, press &ldquo;Mark collected&rdquo;, check the amount and pick the account it went into.</li>
      <li>% of revenue clients: type their revenue for the month and the amount due updates.</li>
      <li>&ldquo;Edit streams&rdquo; to add clients, change fees, or archive a client that ended.</li>
      <li>One-off projects go in Boss Deals instead.</li>
    </ul>
  ),
  newDeal: (
    <ul>
      <li>Add a deal or one-off payment: still a lead, closed and waiting for payment, or already collected.</li>
      <li>Only collected money counts as money made.</li>
    </ul>
  ),
  deals: (
    <ul>
      <li>Change a deal&apos;s stage as it moves. When paid, press collect and pick the account it went into.</li>
      <li>Paid in parts? Use &ldquo;Record deposit&rdquo; for each payment. The rest stays as HP to collect.</li>
    </ul>
  ),
  checkin: (
    <ul>
      <li>Log your day: leads, booked calls, show-ups, closes, ad spend, plus wins and blockers.</li>
      <li>Ad spend here is a quick count. If you also add ad spend in Expenses (or sync it from Meta), that month uses the Expenses number so it isn&apos;t counted twice.</li>
    </ul>
  ),
  clients: (
    <ul>
      <li>One card per client with the tasks still to do for them. Add clients by name, or tap one of your income clients to add it.</li>
      <li>Type a task, pick who&apos;s doing it (tap several names if they&apos;re working on it together), and add a due date if there is one.</li>
      <li>Tap a task&apos;s status to move it along: To do → Doing → Done. Tap ✎ to change who, the due date, or add details.</li>
      <li>&ldquo;Show tasks for&rdquo; filters everything to one person and lists their open tasks across all clients.</li>
      <li>Money: say whether the client pays a monthly retainer or a one-time project, and type the fee or price. It appears in Income or Boss Deals, where you mark it collected.</li>
      <li>Team pay: add what you pay a team member for this client (monthly for a retainer, once for a project). It becomes a bill in Expenses, and the card shows your profit after team pay.</li>
      <li>Squad members come from the Squad tab. A client that ended can be archived from its ⚙.</li>
    </ul>
  ),
  tasks: (
    <ul>
      <li>Your plan sorted by urgency and importance: do first, schedule, delegate, drop.</li>
      <li>Tick tasks off as you finish them. The owner field links tasks to people in Squad.</li>
    </ul>
  ),
  team: (
    <ul>
      <li>The people on your team, their role and monthly cost.</li>
      <li>Everyone here can be given client tasks in the Clients tab. Their open client tasks show on their card.</li>
      <li>This list is for reference. To track paying them, add their pay as a bill in Expenses.</li>
    </ul>
  ),
  adAccounts: (
    <ul>
      <li>Connect each Meta ad account with its own access token (open &ldquo;How to connect&rdquo; for steps).</li>
      <li>Tokens are encrypted on the server and never shown again.</li>
    </ul>
  ),
  campaigns: (
    <ul>
      <li>Pick the campaigns to watch. View only = suggestions. Manage = one-click changes. Autopilot = changes applied daily.</li>
      <li>&ldquo;Sync spend to expenses&rdquo; records each campaign&apos;s spend for the month under Other spending.</li>
    </ul>
  ),
  autopilot: (
    <ul>
      <li>Autopilot checks campaigns set to Autopilot once a day (when daily runs are switched on) or when you press Run now. It pauses losing ads and adjusts budgets within your limits.</li>
      <li>Everything it does is listed here.</li>
    </ul>
  ),
  creatives: (
    <ul>
      <li>All your ad images and videos in one place: made with AI, or your own added by link.</li>
      <li>Press &ldquo;Make test ad&rdquo; on a creative to add it to a tracked campaign as a paused ad, ready for you to check and switch on in Meta.</li>
    </ul>
  ),
  generate: (
    <ul>
      <li>Paste your Higgsfield API key once (it&apos;s encrypted). Then describe the image you want, or turn an image into a short video.</li>
      <li>The quick prompts are editable starting points.</li>
    </ul>
  ),
  ownMedia: (
    <ul>
      <li>Paste a share link to your video or image (Google Drive, Dropbox or a direct link). The app turns it into a direct download link.</li>
    </ul>
  ),
  settings: (
    <ul>
      <li>Your name, business, currency, date format and time zone. Everything in the app uses these.</li>
      <li>The business description helps Kit give advice that fits your business.</li>
    </ul>
  ),
} as const;
