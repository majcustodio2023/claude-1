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
      <li>Chat with Kit below: ask questions, or ask it to rewrite today&apos;s briefing or add quests. Voice on = Kit reads replies out loud. For a real voice acted in Kit&apos;s personality (instead of the robotic browser voice), press &ldquo;Make the voice real&rdquo; and add an OpenAI key.</li>
      <li>Pick Kit&apos;s personality from the menu: dark, funny, drill sergeant, rival, zen, or describe your own. Only the attitude changes; the numbers and advice stay real.</li>
    </ul>
  ),
  quests: (
    <ul>
      <li>Today&apos;s to-do list. Some are suggested from your numbers; add your own too.</li>
      <li>Each quest done earns coins. 🎁 means a loot chest: finish it for a random item. Unfinished ones can be carried over to the next day.</li>
    </ul>
  ),
  bosses: (
    <ul>
      <li>Your biggest open deals. A boss&apos;s HP is the money still to collect.</li>
      <li>When a closed deal is fully paid, a boss fight starts: land the final blow for coins and loot.</li>
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
      <li>Income shows all the money coming in: from your clients (retainers and projects) and other income.</li>
      <li>Client money is set up and edited in the Clients tab. It shows here, marked &ldquo;From Clients&rdquo;, so you can see it next to everything else and mark it collected. It&apos;s the same record, not a copy.</li>
      <li>When a payment arrives, press &ldquo;Mark collected&rdquo;, check the amount and pick the account it went into.</li>
      <li>% of revenue clients: type their revenue for the month here and the amount due updates.</li>
      <li>To change a fee or stop a client, use Edit in Clients.</li>
    </ul>
  ),
  projects: (
    <ul>
      <li>One-off jobs with a set price. Set them up in Clients as a &ldquo;One-time project&rdquo; client. Closed deals from Boss Deals show here too.</li>
      <li>Paid in parts? Use &ldquo;Record deposit&rdquo; for each payment. Fully paid? Press collect and pick the account.</li>
      <li>Prospects you haven&apos;t closed yet live in Boss Deals.</li>
    </ul>
  ),
  otherIncome: (
    <ul>
      <li>Money that doesn&apos;t come from a client, like product, course or SaaS sales.</li>
      <li>&ldquo;Changes every month&rdquo; means you type what actually came in each month (&ldquo;Actual this month&rdquo;). Until you do, the usual amount is used as the estimate.</li>
      <li>If one of these is really a client, open ⚙ and press &ldquo;This is a client&rdquo;.</li>
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
      <li>Everyone you work for, one card each. A client is either a monthly retainer or a one-time project. Its money shows in Income; its work shows here.</li>
      <li>Type a task, pick who&apos;s doing it (tap several names if they&apos;re working on it together), and add a due date if there is one. Tap the status to move it: To do → Doing → Done.</li>
      <li>Team pay: what you pay a team member for this client. It becomes a bill in Expenses, and the card shows your profit after team pay.</li>
      <li>⚙ → Archive when you stop working with a client: the retainer and monthly team pay stop, and history stays. Delete is for mistakes: it removes the client, its tasks and anything not yet paid.</li>
      <li>&ldquo;Show tasks for&rdquo; filters to one person and lists their open tasks across all clients.</li>
    </ul>
  ),
  tasks: (
    <ul>
      <li>Your business-wide plan: things that aren&apos;t for a specific client. Client work goes in the Clients tab.</li>
      <li>Your plan sorted by urgency and importance: do first, schedule, delegate, drop.</li>
      <li>Tick tasks off as you finish them. The owner field links tasks to people in Squad.</li>
    </ul>
  ),
  team: (
    <ul>
      <li>The people on your team. Anyone here can be given client tasks and client pay.</li>
      <li>Base pay is their regular monthly pay. It&apos;s a bill in Expenses, so it counts once and you mark it paid there.</li>
      <li>Client pay (set on each client card) is added on top and listed on their card.</li>
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
      <li>&ldquo;Share results&rdquo; copies a read-only link to that campaign: live results, what needs doing, and the changes made. Send it to your ads expert or client. It updates by itself every time they open it, and they can&apos;t change anything. &ldquo;Turn off link&rdquo; stops it working.</li>
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
  hero: (
    <ul>
      <li>Your hero, your way: pick skin, hair, eye and suit colours (🎨 for any colour).</li>
      <li>Coins come from finishing quests, missions and client tasks, paying bills in full, and beating bosses. Your coins are shown at the top of the screen.</li>
      <li>The gear you earn from achievements stays for good. Untick &ldquo;Show achievement gear&rdquo; to hide it.</li>
    </ul>
  ),
  kitLocker: (
    <ul>
      <li>Pick Kit&apos;s personality: each one has its own look and its own way of talking. The numbers and advice stay real.</li>
      <li>Recolour Kit&apos;s fur and eyes, or press &ldquo;Match personality&rdquo; to go back to that personality&apos;s colours.</li>
      <li>Kit items (hats, shades, collars) are sold in the shop next to yours. The nine-tailed form only drops as loot.</li>
    </ul>
  ),
  inventory: (
    <ul>
      <li>Everything you&apos;ve bought or looted. Tap an item to wear it; one per slot (head, face, weapon, back, aura, pet).</li>
    </ul>
  ),
  shop: (
    <ul>
      <li>Six items at a time, with new stock every 3 days. Buying equips the item straight away.</li>
      <li>Legendary items are loot only: look for 🎁 tasks and get rank S in boss fights.</li>
    </ul>
  ),
  fun: (
    <ul>
      <li>The amount you can spend on yourself this month without hurting the business: a share (20% unless you change it) of what&apos;s spare after this month&apos;s bills and spending.</li>
      <li>It never goes above the cash you hold beyond your safety buffer and unpaid bills, so it&apos;s safe even in a slow month.</li>
      <li>Bought something? Press &ldquo;I spent on fun&rdquo; and it comes out of the account you pick. Not spending it? Press &ldquo;I&apos;m saving it instead&rdquo;.</li>
      <li>Past months show what was safe, what you spent, and whether you spent it, saved it or went over.</li>
    </ul>
  ),
  settings: (
    <ul>
      <li>Your name, business, currency, date format and time zone. Everything in the app uses these.</li>
      <li>The business description helps Kit give advice that fits your business.</li>
    </ul>
  ),
} as const;
