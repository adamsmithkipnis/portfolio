import { Conversation } from "@/types/messages";

// Helper function to create a timestamp for a specific time ago
const getTimeAgo = (minutes: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

// Create initial conversations with static IDs
export const initialConversations: Conversation[] = [
  // ─── new roster seeds (in progress) ─────────────────────────
  {
    id: "c6cf110a-03b9-4f88-babc-07c6e48f5f21",
    name: "The City",
    recipients: [
      { id: "4b7924ba-801d-4041-b791-f5ad8d1039fa", name: "Jane Jacobs" },
      { id: "848901c0-72ae-46e3-824f-2f5d95131a25", name: "Robert Moses" },
      { id: "9345de5f-98d7-4926-a0f3-4db79b5e4b55", name: "Frank Gehry" },
      { id: "43cfe940-15e5-48da-802e-6b06871a413c", name: "Sudhir Venkatesh" },
    ],
    lastMessageTime: getTimeAgo(3),
    unreadCount: 2,
    pinned: true,
    messages: [
      {
        id: "48bb785e-890b-415b-bbf0-8445c6eaf3b6",
        content: "genuine question — if you could un-build one thing, what would it be",
        htmlContent: "<p>genuine question — if you could un-build one thing, what would it be</p>",
        sender: "me",
        timestamp: "2025-03-11T18:02:14.000Z",
      },
      {
        id: "b7f31103-0866-42f9-a308-3eb2c7b84e41",
        content:
          "Nothing. 416 miles of parkway. 658 playgrounds. 13 bridges. You don't un-build a city, you clear a path through it. In an overbuilt metropolis you hack your way with a meat axe.",
        sender: "Robert Moses",
        timestamp: "2025-03-11T18:03:01.000Z",
      },
      {
        id: "03963ac7-0545-4632-88b0-e85061d2ffd1",
        content:
          "You hacked through East Tremont. Fifteen hundred families. In forty years I have never once heard you name one of them.",
        sender: "Jane Jacobs",
        timestamp: "2025-03-11T18:03:40.000Z",
        reactions: [
          {
            type: "emphasize",
            sender: "Sudhir Venkatesh",
            timestamp: "2025-03-11T18:04:12.000Z",
          },
        ],
      },
      {
        id: "33011f8e-9d6e-4496-8686-65fb13ed587a",
        content: "You can't make an omelet without breaking eggs. I've been called worse by better.",
        sender: "Robert Moses",
        timestamp: "2025-03-11T18:04:22.000Z",
      },
      {
        id: "04e58eaa-e2e5-43a8-bfa7-716c62bf3956",
        content:
          "I spent seven years inside a building that came out of that thinking. Not one of yours — Chicago — but the same blueprint. Towers, superblock, a lawn nobody crossed.",
        sender: "Sudhir Venkatesh",
        timestamp: "2025-03-11T18:05:03.000Z",
      },
      {
        id: "647849c9-c2a2-4d43-8eb6-a0c6ef2c1431",
        content: "And?",
        sender: "Jane Jacobs",
        timestamp: "2025-03-11T18:05:18.000Z",
      },
      {
        id: "c9cf2ccd-5b1c-454c-a9b2-373a90654c21",
        content:
          "And it wasn't empty. There was an economy in there. Leadership, dues, a way of settling disputes. Not the order anyone drew on a plan. But order.",
        sender: "Sudhir Venkatesh",
        timestamp: "2025-03-11T18:05:44.000Z",
      },
      {
        id: "91325375-ee85-45dd-aade-9acae94474bf",
        content: "That is people making a city in spite of the plan. It is not a defense of the plan.",
        sender: "Jane Jacobs",
        timestamp: "2025-03-11T18:06:09.000Z",
      },
      {
        id: "95134c5f-ef7d-435e-a6c3-5956841704c3",
        content:
          "No. But it complicates eyes on the street. Nobody was watching from a stoop. There were no stoops.",
        sender: "Sudhir Venkatesh",
        timestamp: "2025-03-11T18:06:31.000Z",
      },
      {
        id: "0cb9e106-b364-45c6-8599-7d6b622d5fdb",
        content: "are we doing cities? I make buildings. different job",
        sender: "Frank Gehry",
        timestamp: "2025-03-11T18:07:02.000Z",
      },
      {
        id: "130ce69e-73de-4946-b5c5-4c34e2caebff",
        content: "That is precisely the problem.",
        sender: "Jane Jacobs",
        timestamp: "2025-03-11T18:07:14.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "Robert Moses",
            timestamp: "2025-03-11T18:07:50.000Z",
          },
        ],
      },
      {
        id: "4e61cfbf-4d4b-402b-a993-cd040b7ab44e",
        content:
          "it's an honest answer. somebody hands me a site and a budget and I make the best thing I know how to make. I'm not the zoning board",
        sender: "Frank Gehry",
        timestamp: "2025-03-11T18:07:38.000Z",
      },
      {
        id: "e4fc7e3f-1040-4aa0-a3cb-468f2c501fc9",
        content: "bilbao though",
        htmlContent: "<p>bilbao though</p>",
        sender: "me",
        timestamp: "2025-03-11T18:08:00.000Z",
      },
      {
        id: "47ae4a34-3a1b-43fb-83c4-5b105d125a4a",
        content: "what about it",
        sender: "Frank Gehry",
        timestamp: "2025-03-11T18:08:11.000Z",
      },
      {
        id: "515c86ef-f274-4217-b8cc-0d3aec150e7d",
        content: "What is happening on that sidewalk at eight o'clock on a Tuesday?",
        sender: "Jane Jacobs",
        timestamp: "2025-03-11T18:08:29.000Z",
      },
      {
        id: "86f0bc74-0e75-4cfe-83b2-04f1383ce844",
        content: "people are going home. same as any sidewalk",
        sender: "Frank Gehry",
        timestamp: "2025-03-11T18:08:47.000Z",
      },
      {
        id: "a100357e-c2e5-40f0-906d-f4c8e8843a14",
        content: "It put that city on a map. Which is more than a sidewalk has ever done.",
        sender: "Robert Moses",
        timestamp: "2025-03-11T18:09:15.000Z",
      },
    ],
  },
  {
    id: "8a4b803e-4cbb-49c2-ad1c-da17ab603092",
    recipients: [
      { id: "4da3043e-a143-49c3-93e8-acb47e15810b", name: "Will Guidara" },
      { id: "fbcac96a-5956-4964-b92d-f5086255dd92", name: "Anthony Bourdain" },
      { id: "cfe95234-1a1a-47b7-901e-414412067fb2", name: "Dishwasher Pete" },
    ],
    lastMessageTime: getTimeAgo(47),
    unreadCount: 1,
    messages: [
      {
        id: "14ae16f4-283d-4e08-95a2-1d9470d2bf78",
        content: "what do you actually owe someone you're serving",
        htmlContent: "<p>what do you actually owe someone you're serving</p>",
        sender: "me",
        timestamp: "2025-03-11T17:14:02.000Z",
      },
      {
        id: "a5b8a032-6644-45c5-9aa2-6cb2fb52d861",
        content:
          "Everything you can give them that they didn't ask for. A table once mentioned they'd spent a week in New York and never had a street hot dog. We bought one off a cart on 24th and plated it.",
        sender: "Will Guidara",
        timestamp: "2025-03-11T17:14:51.000Z",
      },
      {
        id: "7d5623e9-6da3-4527-a77b-c35d5e31b108",
        content:
          "That is either the most beautiful thing I've heard all year or completely unhinged and I genuinely cannot decide which.",
        sender: "Anthony Bourdain",
        timestamp: "2025-03-11T17:15:20.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "Will Guidara",
            timestamp: "2025-03-11T17:15:44.000Z",
          },
        ],
      },
      {
        id: "b2480151-fe65-4493-9d7b-6b0e04447edc",
        content: "Why not both",
        sender: "Will Guidara",
        timestamp: "2025-03-11T17:15:38.000Z",
      },
      {
        id: "d7c1a362-ac10-4a69-ad83-0547a0734de9",
        content:
          "Because I have worked for people who'd have kept a garde manger two hours past close to pull that off and then called it hospitality in the staff meeting.",
        sender: "Anthony Bourdain",
        timestamp: "2025-03-11T17:16:12.000Z",
      },
      {
        id: "3be41b7a-9d5d-498c-8be8-d67ac6bceb40",
        content:
          "That's fair, and it's the whole thing. The gesture only works if the house is already in order. You manage 95% of the cost to the penny so you can spend the last 5% like a lunatic.",
        sender: "Will Guidara",
        timestamp: "2025-03-11T17:16:58.000Z",
      },
      {
        id: "722a2e51-0f77-472d-99d1-2365e5058ec5",
        content: "I owe them clean dishes.",
        sender: "Dishwasher Pete",
        timestamp: "2025-03-11T17:17:30.000Z",
      },
      {
        id: "0998415e-7d61-450a-97bb-ff09d6483552",
        content:
          "I'm not being cute about it. They paid for clean dishes. Everything past that is something the restaurant wants from me for free, and it costs more than the tip does.",
        sender: "Dishwasher Pete",
        timestamp: "2025-03-11T17:17:52.000Z",
      },
      {
        id: "5c9a1e77-4b3e-4c1a-9f2d-7a1c8e0d3b45",
        content: "Doesn't it make the job better though? Caring about it?",
        sender: "Will Guidara",
        timestamp: "2025-03-11T17:18:20.000Z",
      },
      {
        id: "1f4d2a90-8c6b-4e35-a7f1-2d9b6c4e8a03",
        content: "It makes the job harder to leave. Those aren't the same thing.",
        sender: "Dishwasher Pete",
        timestamp: "2025-03-11T17:18:44.000Z",
      },
      {
        id: "6b3e9c14-7a52-4d80-b6c9-3e1f5a2d9c74",
        content: "You published a zine about dish pits for twelve years.",
        sender: "Will Guidara",
        timestamp: "2025-03-11T17:19:10.000Z",
      },
      {
        id: "e0a7f463-2b91-4d58-97c3-8f1e4a6b0d29",
        content:
          "That isn't indifference. That's the most attention anybody has ever paid to a dish pit in the history of the trade. You just won't let a manager have any of it.",
        sender: "Will Guidara",
        timestamp: "2025-03-11T17:19:24.000Z",
        reactions: [
          {
            type: "emphasize",
            sender: "Anthony Bourdain",
            timestamp: "2025-03-11T17:19:38.000Z",
          },
        ],
      },
      {
        id: "b41c8e57-9d02-4f6b-a83e-5c179b4d206f",
        content: "That one was mine.",
        sender: "Dishwasher Pete",
        timestamp: "2025-03-11T17:19:52.000Z",
      },
      {
        id: "7c2f5b19-6d84-4a03-b1e7-3a9d0c5f8e46",
        content:
          "And there's the whole fight. Nobody in this chat doesn't care. We just can't agree on who gets to collect it.",
        sender: "Anthony Bourdain",
        timestamp: "2025-03-11T17:20:11.000Z",
      },
      {
        id: "9d7c4b28-1e63-4f97-8a05-4c2b7e6d1f38",
        content: "pete how many states was it",
        htmlContent: "<p>pete how many states was it</p>",
        sender: "me",
        timestamp: "2025-03-11T17:20:29.000Z",
      },
      {
        id: "2a8f6d51-9b47-4c02-83e6-5d1a9c3b7e60",
        content: "Thirty-three. Quit every one of them.",
        sender: "Dishwasher Pete",
        timestamp: "2025-03-11T17:20:47.000Z",
      },
    ],
  },
  {
    id: "7e2c5a93-3d81-4b6f-9c04-8a5e2f1d7b96",
    recipients: [
      { id: "4f9b1c67-2e08-4a35-b7d1-6c3e9a8f0d52", name: "Chuck Yeager" },
      { id: "8c1d3f74-5a92-4e60-9b28-1f7c4d6e2a85", name: "Bob Hoover" },
    ],
    lastMessageTime: getTimeAgo(180),
    unreadCount: 0,
    messages: [
      {
        id: "3d6a8e15-7c24-4f91-a058-9b2e5c1d4f73",
        content: "who actually closed the hatch on the x-1",
        htmlContent: "<p>who actually closed the hatch on the x-1</p>",
        sender: "me",
        timestamp: "2025-03-11T14:31:07.000Z",
      },
      {
        id: "5b9f2c48-1d76-4a03-8e95-7c4a6b2f9d10",
        content: "Ridley. Sawed off a broom handle so I'd have leverage. Couldn't lift my right arm.",
        sender: "Chuck Yeager",
        timestamp: "2025-03-11T14:31:52.000Z",
      },
      {
        id: "0c4e7a92-6b35-48df-9a17-2e8c5d3b6f41",
        content:
          "He'd broken two ribs coming off a horse at Pancho's two nights before. Told the flight surgeon nothing. Told me only because he needed somebody to get him up the ladder.",
        sender: "Bob Hoover",
        timestamp: "2025-03-11T14:32:30.000Z",
      },
      {
        id: "9a1c6f37-4d82-40b5-8e73-6f2a9c4e1d58",
        content: "You talk too much, Bob.",
        sender: "Chuck Yeager",
        timestamp: "2025-03-11T14:32:44.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "Bob Hoover",
            timestamp: "2025-03-11T14:33:01.000Z",
          },
        ],
      },
      {
        id: "4e8b3d05-9f61-4c27-a94d-1b7e6a2c5f39",
        content: "Forty years I've been telling that story and forty years you've said that.",
        sender: "Bob Hoover",
        timestamp: "2025-03-11T14:33:12.000Z",
      },
      {
        id: "7f2a9c64-3e15-4b80-96d2-8c5f1a4e7b03",
        content: "Still true.",
        sender: "Chuck Yeager",
        timestamp: "2025-03-11T14:33:20.000Z",
      },
      {
        id: "1d5e8b37-6a94-42c1-b70f-9e3c7d2a5f81",
        content: "you were flying chase right",
        htmlContent: "<p>you were flying chase right</p>",
        sender: "me",
        timestamp: "2025-03-11T14:33:55.000Z",
      },
      {
        id: "6c3f1a80-8d27-4e95-a1b6-5f4d9c2e7a36",
        content:
          "P-80. I was the backup pilot. Best seat anybody had that morning and I wasn't the one flying the airplane.",
        sender: "Bob Hoover",
        timestamp: "2025-03-11T14:34:28.000Z",
      },
      {
        id: "8b6d2e49-1c73-4a08-95f2-7e1a6c3d9b45",
        content: "You'd have done it fine.",
        sender: "Chuck Yeager",
        timestamp: "2025-03-11T14:34:47.000Z",
      },
      {
        id: "2f9a4c17-5b68-4d31-8e06-3c7b5a1f6d92",
        content: "I know.",
        sender: "Bob Hoover",
        timestamp: "2025-03-11T14:34:53.000Z",
        reactions: [
          {
            type: "heart",
            sender: "Chuck Yeager",
            timestamp: "2025-03-11T14:35:20.000Z",
          },
        ],
      },
    ],
  },
  {
    id: "00a01156-c7fe-4c6c-980e-c78f1039feff",
    recipients: [
      { id: "edb09cfd-62e2-4ac9-823b-8364259a555a", name: "Alan Lomax" },
      { id: "abbbb24e-f41e-4bab-bdf2-56abc04f54cc", name: "Liliʻuokalani" },
    ],
    lastMessageTime: getTimeAgo(320),
    unreadCount: 1,
    messages: [
      {
        id: "d712833d-423d-4bc4-8466-bf135942e7d2",
        content: "who owns a song",
        htmlContent: "<p>who owns a song</p>",
        sender: "me",
        timestamp: "2025-03-11T09:41:03.000Z",
      },
      {
        id: "24c065d8-a769-42e7-81ae-3ad70887e031",
        content:
          "Nobody, and that's the entire point of the work. I hauled a disc cutter into Parchman Farm because those songs lived nowhere except in the throats of men who were going to die inside it.",
        sender: "Alan Lomax",
        timestamp: "2025-03-11T09:42:11.000Z",
      },
      {
        id: "9e5f08af-eb98-4e1c-8715-53ca3e3e1197",
        content: "Then whose name is on the record.",
        sender: "Liliʻuokalani",
        timestamp: "2025-03-11T09:42:48.000Z",
      },
      {
        id: "0fe24d27-3dcb-4dbb-b56f-a162932187c9",
        content: "Mine is on the collection. Theirs is on the song.",
        sender: "Alan Lomax",
        timestamp: "2025-03-11T09:43:09.000Z",
      },
      {
        id: "500bd3c1-81bd-4c26-bb28-b57028957032",
        content: "That is a distinction the collector has always found convincing.",
        sender: "Liliʻuokalani",
        timestamp: "2025-03-11T09:43:31.000Z",
        reactions: [
          {
            type: "emphasize",
            sender: "me",
            timestamp: "2025-03-11T09:44:02.000Z",
          },
        ],
      },
      {
        id: "f4a8a6c4-b59a-4d9c-aca2-7a8b6db53c7e",
        content: "With respect, ma'am, the alternative was silence.",
        sender: "Alan Lomax",
        timestamp: "2025-03-11T09:44:15.000Z",
      },
      {
        id: "4ad851e4-062d-47ab-b14b-0b72139afbff",
        content:
          "No. The alternative was that it remained ours and you did not hear it. Those are different things, and only one of them is a loss to you.",
        sender: "Liliʻuokalani",
        timestamp: "2025-03-11T09:44:52.000Z",
      },
      {
        id: "c90f4cc7-fbcb-42ec-bc25-f00ffec9ad59",
        content:
          "There are eleven men singing on the Parchman discs. I don't know most of their names — nobody wrote them down, that was rather the function of the place. Had I stayed home there'd be no discs and still no names. Tell me which of those you prefer.",
        sender: "Alan Lomax",
        timestamp: "2025-03-11T09:45:40.000Z",
      },
      {
        id: "85f0a214-8baf-4790-b516-dea1c32187b4",
        content: "I have no answer to that, and I will not pretend to one.",
        sender: "Liliʻuokalani",
        timestamp: "2025-03-11T09:46:18.000Z",
      },
      {
        id: "44ab3735-c592-4f21-a339-da685f6529ad",
        content:
          "Only this. You went because you feared their music would vanish. Mine did not vanish. It was taken up, and sold, and sung back to me by people who believed it theirs to sing. Preservation was never the danger.",
        sender: "Liliʻuokalani",
        timestamp: "2025-03-11T09:46:44.000Z",
      },
      {
        id: "79f3fc27-1910-443f-8e8c-1c7e3b50db85",
        content: "Then what was.",
        sender: "Alan Lomax",
        timestamp: "2025-03-11T09:47:02.000Z",
      },
      {
        id: "3c8b0f92-a5d7-4e61-9b04-6d2f8a1c7e35",
        content:
          "Affection. I wrote Aloha ʻOe as a farewell between two people. It is now the sound a ship makes leaving a dock.",
        sender: "Liliʻuokalani",
        timestamp: "2025-03-11T09:47:29.000Z",
      },
    ],
  },
  {
    id: "82d337cc-36a6-4a62-bd34-dd4b35c37141",
    name: "The Demo",
    recipients: [
      { id: "d64226eb-d9a4-4142-846f-fc62e3dbd8ba", name: "Adele Goldberg" },
      { id: "f1cc3477-fdd7-43b5-9127-d6850e0f1931", name: "Steve Jobs" },
      { id: "e30ac268-6323-452a-adb5-30d783016605", name: "Jony Ive" },
    ],
    lastMessageTime: getTimeAgo(95),
    unreadCount: 3,
    messages: [
      {
        id: "f6c54caf-6e48-4659-aa4e-3e451cbddc90",
        content: "adele — is it true you tried to stop the demo",
        htmlContent: "<p>adele — is it true you tried to stop the demo</p>",
        sender: "me",
        timestamp: "2025-03-11T16:20:04.000Z",
      },
      {
        id: "d8353eda-b912-49eb-84ec-89dd800bae99",
        content:
          "I told my management it was a mistake. They told me to do it anyway. So I did it anyway.",
        sender: "Adele Goldberg",
        timestamp: "2025-03-11T16:20:51.000Z",
      },
      {
        id: "ef73f9c0-7f8b-44a0-ab0f-92e6b928294c",
        content:
          "You should be thanking me. That work sat in that building for six years doing nothing. Xerox could have owned the entire computer industry and they were busy selling copiers.",
        sender: "Steve Jobs",
        timestamp: "2025-03-11T16:21:19.000Z",
      },
      {
        id: "72dbb56a-e0d2-479f-9e32-633f60df0b79",
        content:
          "It was not doing nothing. There were children in that building writing their own programs in Smalltalk. That is what it was for.",
        sender: "Adele Goldberg",
        timestamp: "2025-03-11T16:21:58.000Z",
      },
      {
        id: "e219082a-7098-450d-818f-0f01b145c1d4",
        content: "How many? Twenty? I put it in front of millions of people.",
        sender: "Steve Jobs",
        timestamp: "2025-03-11T16:22:14.000Z",
      },
      {
        id: "6613cce5-0af7-40e6-a9ef-2d245f4a393f",
        content:
          "You put a picture of it in front of millions of people. You took the windows and the mouse. You did not take the part where the person using it can open the system and change it. That was the whole idea, and it is the one thing you left on the table.",
        sender: "Adele Goldberg",
        timestamp: "2025-03-11T16:23:02.000Z",
        reactions: [
          {
            type: "emphasize",
            sender: "Jony Ive",
            timestamp: "2025-03-11T16:23:40.000Z",
          },
        ],
      },
      {
        id: "e73f5ce5-6ba5-431e-8a0a-9dd0f2a670e4",
        content: "I've thought about this more than is probably healthy.",
        sender: "Jony Ive",
        timestamp: "2025-03-11T16:24:11.000Z",
      },
      {
        id: "3339221d-f00b-4d7e-81d1-b85f4d1b8149",
        content:
          "Everything I worked on was sealed. No screws, nothing for anyone to adjust, and we made that a virtue — we called it seamless. I believed in it completely. I mostly still do.",
        sender: "Jony Ive",
        timestamp: "2025-03-11T16:24:38.000Z",
      },
      {
        id: "b3607bc0-f9ce-4e89-aa21-7944f7f87e97",
        content: "But that is the exact opposite of what you are describing, and I had never heard it put that way.",
        sender: "Jony Ive",
        timestamp: "2025-03-11T16:24:52.000Z",
      },
      {
        id: "cff95f6a-b2eb-4088-b0cd-cc858bf3f558",
        content: "It usually isn't.",
        sender: "Adele Goldberg",
        timestamp: "2025-03-11T16:25:09.000Z",
      },
      {
        id: "7804503c-49bf-4d85-8dba-84b6621a0b7c",
        content:
          "It isn't a moral question. People don't want to change the system. They want it to work.",
        sender: "Steve Jobs",
        timestamp: "2025-03-11T16:25:44.000Z",
      },
      {
        id: "03765c99-6bdc-4f3c-8f9b-bf4d38c5180e",
        content: "You never asked them.",
        sender: "Adele Goldberg",
        timestamp: "2025-03-11T16:26:01.000Z",
      },
      {
        id: "4769ca73-5f76-4b94-b954-84d0959e4540",
        content: "I never had to.",
        sender: "Steve Jobs",
        timestamp: "2025-03-11T16:26:12.000Z",
      },
    ],
  },
  {
    id: "407c875a-eeef-4bfc-af0a-bbec70e8904c",
    recipients: [
      { id: "ae1a4100-022f-4393-a631-902e0b2ecfde", name: "Rick Rubin" },
      { id: "4e110dec-6df0-4057-8f64-043c62f230ac", name: "Brian Eno" },
      { id: "ad1f8c30-15c6-4a3c-b983-a0f1cde53c0a", name: "Koji Kondo" },
    ],
    lastMessageTime: getTimeAgo(210),
    unreadCount: 0,
    messages: [
      {
        id: "9c9fd2d3-68ee-4427-a190-a47d6ddf3826",
        content: "what does a producer actually add",
        htmlContent: "<p>what does a producer actually add</p>",
        sender: "me",
        timestamp: "2025-03-11T13:55:12.000Z",
      },
      {
        id: "589b0cd9-81e5-42e0-a482-1a22a89e45e6",
        content:
          "As little as possible. Mostly I sit there. When something true happens you can feel the room change, and my whole job is to be paying attention when it does.",
        sender: "Rick Rubin",
        timestamp: "2025-03-11T13:56:03.000Z",
      },
      {
        id: "12046f6e-49ed-4e61-9dbc-184056b4b168",
        content: "That is a very beautiful description of a man with no method.",
        sender: "Brian Eno",
        timestamp: "2025-03-11T13:56:31.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "Rick Rubin",
            timestamp: "2025-03-11T13:57:02.000Z",
          },
        ],
      },
      {
        id: "e3ebd3f3-d6ff-4721-a6a6-7acab42ae3c7",
        content:
          "I do the opposite. I hand you a card that says honour thy error as a hidden intention and I make you follow it. Not because the card is wise — because you cannot get out of your own habits by trying harder at them.",
        sender: "Brian Eno",
        timestamp: "2025-03-11T13:57:18.000Z",
      },
      {
        id: "3cd8d5c5-e781-4c0f-ba4e-fbbd3d72ba8e",
        content: "Doesn't that give you the card's record instead of theirs?",
        sender: "Rick Rubin",
        timestamp: "2025-03-11T13:57:49.000Z",
      },
      {
        id: "0f650ce6-b7d1-42f6-9a7d-8fb9bf94daf4",
        content: "Yes. That's rather the point. Their record is the one they already know how to make.",
        sender: "Brian Eno",
        timestamp: "2025-03-11T13:58:11.000Z",
      },
      {
        id: "c2f0ffa3-56eb-4b7b-917c-90dcc446b8f6",
        content: "May I ask you both something first. When you finish a record, is it finished?",
        sender: "Koji Kondo",
        timestamp: "2025-03-11T13:58:52.000Z",
      },
      {
        id: "98bbc036-c452-4f97-a820-dfa187c7c638",
        content: "Yes.",
        sender: "Rick Rubin",
        timestamp: "2025-03-11T13:59:04.000Z",
      },
      {
        id: "9a43fccf-35b6-4dbe-aefe-19824bdeb8e1",
        content: "Ideally no. Practically yes.",
        sender: "Brian Eno",
        timestamp: "2025-03-11T13:59:15.000Z",
      },
      {
        id: "db1a400d-f158-4477-89b2-757ca7b32b81",
        content:
          "Then we are doing different work. The field theme in Ocarina of Time is twelve phrases of eight measures, assembled in a random order every time it plays. There is no finished version. There is no take.",
        sender: "Koji Kondo",
        timestamp: "2025-03-11T13:59:58.000Z",
      },
      {
        id: "a91974c1-ac54-43eb-aef8-388d2820a2fe",
        content: "Oh, that's wonderful. That is exactly the thing.",
        sender: "Brian Eno",
        timestamp: "2025-03-11T14:00:16.000Z",
      },
      {
        id: "dce93d0d-3ffb-4567-a0e5-0a09c9a83ecc",
        content:
          "It was not a philosophy. The player is in that field for forty hours. If it were one fixed piece they would come to hate me.",
        sender: "Koji Kondo",
        timestamp: "2025-03-11T14:00:44.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "Rick Rubin",
            timestamp: "2025-03-11T14:01:10.000Z",
          },
        ],
      },
      {
        id: "5abedccc-4371-42d2-a1f4-1c570e4c21f5",
        content:
          "That is still a decision, though. You chose where the seams go. That's the same job the rest of us have.",
        sender: "Rick Rubin",
        timestamp: "2025-03-11T14:01:29.000Z",
      },
    ],
  },
  {
    id: "317dd1a5-bd3b-4c53-91bb-cc34d841f115",
    recipients: [
      { id: "5faa5924-3c47-4d8f-80de-6c1c2adb1fdd", name: "Vivienne Westwood" },
      { id: "7658d8bb-5d40-4ee9-9f24-7e9cb3182f6a", name: "Aaron Cometbus" },
      { id: "cd8c6646-7e78-4ec7-b036-7c5d80406655", name: "Tim Armstrong" },
    ],
    lastMessageTime: getTimeAgo(430),
    unreadCount: 0,
    messages: [
      {
        id: "1c9d5deb-02f1-47ac-b6dd-b93b5518cf95",
        content: "is there even such a thing as selling out anymore",
        htmlContent: "<p>is there even such a thing as selling out anymore</p>",
        sender: "me",
        timestamp: "2025-03-11T11:02:33.000Z",
      },
      {
        id: "c00f1cdb-6327-408a-bb2e-5c593e407ada",
        content:
          "There is. It's just that nobody's embarrassed by it anymore, so the phrase stopped doing any work.",
        sender: "Aaron Cometbus",
        timestamp: "2025-03-11T11:03:15.000Z",
      },
      {
        id: "58fbb02d-9002-4cd4-8bcc-ab6dc5f7349b",
        content: "I was accused of it constantly. I went on selling clothes.",
        sender: "Vivienne Westwood",
        timestamp: "2025-03-11T11:03:47.000Z",
      },
      {
        id: "13c76db4-df0c-4ce8-854f-bcfb7f08fc2b",
        content:
          "And here is what nobody making that accusation ever explains. I was a schoolteacher with no training and no money, and the shop was how I ate. You are describing a purity that only people with somewhere to fall back on can afford.",
        sender: "Vivienne Westwood",
        timestamp: "2025-03-11T11:04:29.000Z",
      },
      {
        id: "7d197e13-c1e4-4d57-85b9-7f906639bb00",
        content:
          "That's fair. Most of the people who lectured me about integrity had parents.",
        sender: "Aaron Cometbus",
        timestamp: "2025-03-11T11:05:02.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "Tim Armstrong",
            timestamp: "2025-03-11T11:05:31.000Z",
          },
        ],
      },
      {
        id: "98fa271f-ba94-4fdd-97b8-1154cb339df3",
        content: "vivienne did you ever think about stopping",
        htmlContent: "<p>vivienne did you ever think about stopping</p>",
        sender: "me",
        timestamp: "2025-03-11T11:05:50.000Z",
      },
      {
        id: "bc516482-b5be-44ed-a3d8-a93afaf4b21f",
        content: "Constantly. Then I would look at what people were wearing and change my mind.",
        sender: "Vivienne Westwood",
        timestamp: "2025-03-11T11:06:12.000Z",
      },
      {
        id: "bc931bc7-748a-4919-a119-637431b98450",
        content:
          "We signed. Everybody had an opinion about it. What I remember is my friends could pay rent that year.",
        sender: "Tim Armstrong",
        timestamp: "2025-03-11T11:06:58.000Z",
      },
      {
        id: "7ca19ed2-18c5-4836-a52f-6a2fdc0879be",
        content:
          "The thing I actually feel bad about isn't the money. It's the shows where we got big enough that I couldn't see anybody's face anymore.",
        sender: "Tim Armstrong",
        timestamp: "2025-03-11T11:07:26.000Z",
      },
      {
        id: "02c0e4a8-a8b6-45e7-95b6-8da7f3845911",
        content: "That is the correct thing to feel bad about.",
        sender: "Vivienne Westwood",
        timestamp: "2025-03-11T11:07:49.000Z",
      },
      {
        id: "3ced5e16-09ae-4a06-829d-97eb200fb2c7",
        content: "The van was better.",
        sender: "Aaron Cometbus",
        timestamp: "2025-03-11T11:08:11.000Z",
      },
      {
        id: "cfa6b609-2c23-4152-824a-190ccb48d371",
        content: "The van was terrible.",
        sender: "Tim Armstrong",
        timestamp: "2025-03-11T11:08:19.000Z",
      },
      {
        id: "41c2272f-9d81-4ba7-9a13-a55ec1b22cf6",
        content: "It was better.",
        sender: "Aaron Cometbus",
        timestamp: "2025-03-11T11:08:26.000Z",
        reactions: [
          {
            type: "heart",
            sender: "Tim Armstrong",
            timestamp: "2025-03-11T11:08:52.000Z",
          },
        ],
      },
    ],
  },
  {
    id: "b8f3ef78-4c7e-4b83-94df-357da21178ab",
    recipients: [
      { id: "fab3de38-25aa-48d3-9260-e29c415ea8e3", name: "Socrates" },
      { id: "83013fad-787d-4ed2-843a-d20c92c853e4", name: "Alan Turing" },
    ],
    lastMessageTime: getTimeAgo(1450),
    unreadCount: 0,
    messages: [
      {
        id: "10dc85d6-1fe4-4ca5-aa79-104508a7311f",
        content: "could a machine think",
        htmlContent: "<p>could a machine think</p>",
        sender: "me",
        timestamp: "2025-03-10T18:44:02.000Z",
      },
      {
        id: "78851569-f968-40aa-a754-0ed669ca2eb7",
        content:
          "Wrong question. Far too vague to settle, and everyone means something different by it. Ask me one I can answer with an experiment.",
        sender: "Alan Turing",
        timestamp: "2025-03-10T18:44:38.000Z",
      },
      {
        id: "a7fc427f-5c89-4ba5-87ef-06deed61db69",
        content: "Then let us find one. What would you accept as proof?",
        sender: "Socrates",
        timestamp: "2025-03-10T18:45:01.000Z",
      },
      {
        id: "60d9a665-a14e-4b02-aad0-a7464bdd5c40",
        content:
          "Put a person at a teleprinter. They converse with a machine and with another person and cannot tell which is which. If they can't tell, the question has answered itself.",
        sender: "Alan Turing",
        timestamp: "2025-03-10T18:45:44.000Z",
      },
      {
        id: "8c6e7957-0614-4782-9549-526ee8305e4a",
        content: "It has answered whether they can tell. Has it answered whether the machine thinks?",
        sender: "Socrates",
        timestamp: "2025-03-10T18:46:10.000Z",
      },
      {
        id: "3f8a7dde-d4bb-4e71-958d-30a628a4b58f",
        content:
          "How would you answer it for me? I can't see inside your head either. I assume you think because you behave as though you do.",
        sender: "Alan Turing",
        timestamp: "2025-03-10T18:46:47.000Z",
      },
      {
        id: "84e84113-3e9a-4157-b3ab-f212e66854d1",
        content: "That is honest. So you do not know that I think.",
        sender: "Socrates",
        timestamp: "2025-03-10T18:47:05.000Z",
      },
      {
        id: "49bfc4ab-490b-4d06-af84-7de89309e69d",
        content:
          "No. I take it on faith, same as everybody does. I'm only proposing we extend the machine the same courtesy.",
        sender: "Alan Turing",
        timestamp: "2025-03-10T18:47:31.000Z",
      },
      {
        id: "d7bf1ad2-91bd-4b3f-b7bc-f17dcdf534f4",
        content:
          "Then your test does not discover thinking. It discovers where you have decided to be polite.",
        sender: "Socrates",
        timestamp: "2025-03-10T18:48:09.000Z",
        reactions: [
          {
            type: "emphasize",
            sender: "me",
            timestamp: "2025-03-10T18:48:40.000Z",
          },
        ],
      },
      {
        id: "ce0af041-7d77-4724-913d-e158ca6179f1",
        content: "That's rather good, actually.",
        sender: "Alan Turing",
        timestamp: "2025-03-10T18:48:55.000Z",
      },
      {
        id: "a67609eb-7f06-4383-96ec-34983a890a16",
        content: "I still think we should build it and see.",
        sender: "Alan Turing",
        timestamp: "2025-03-10T18:49:03.000Z",
      },
    ],
  },
  {
    id: "1027145c-dfa5-44ad-bb44-f05b28af5669",
    recipients: [
      { id: "1e0d8487-9734-4c01-9a4d-2519d12bcdb8", name: "Immanuel Kant" },
      { id: "cba9a744-1537-4666-a636-748b31b5308e", name: "John Stuart Mill" },
      { id: "b81d9655-35c2-43ec-8165-2c79b7d563cd", name: "Socrates" },
    ],
    lastMessageTime: getTimeAgo(620),
    unreadCount: 0,
    messages: [
      {
        id: "2bafcb5b-5bba-4743-956f-1e30f7d17ef4",
        content: "someone gives you a gift. you hate it. they ask if you like it. what do you say",
        htmlContent: "<p>someone gives you a gift. you hate it. they ask if you like it. what do you say</p>",
        sender: "me",
        timestamp: "2025-03-11T07:52:19.000Z",
      },
      {
        id: "7cecfd06-b6ad-4a55-805a-d081a2d6f5b9",
        content:
          "You say something kind. The truth purchases nothing here and costs them a great deal. That is the whole calculation and it is not a difficult one.",
        sender: "John Stuart Mill",
        timestamp: "2025-03-11T07:53:04.000Z",
      },
      {
        id: "34b881a2-4e09-4b75-b4d4-2a6dff6b2a3c",
        content:
          "You may not lie. Not here, and not to the murderer at your door, which is the case I am forever made to answer for. If the lie is permitted whenever it is convenient, you have not got a principle. You have got a preference.",
        sender: "Immanuel Kant",
        timestamp: "2025-03-11T07:53:51.000Z",
      },
      {
        id: "5ca36f0c-df48-4bcd-94b5-1964ccd4f924",
        content:
          "A man is at the door with an axe and you are explaining your filing system to him.",
        sender: "John Stuart Mill",
        timestamp: "2025-03-11T07:54:12.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "Socrates",
            timestamp: "2025-03-11T07:54:40.000Z",
          },
        ],
      },
      {
        id: "b2f2016c-4909-408f-8553-73a3d79d3197",
        content:
          "I would not tell him where his victim was. I am not obliged to speak at all. I am obliged not to lie. The two are not the same and you know it.",
        sender: "Immanuel Kant",
        timestamp: "2025-03-11T07:54:58.000Z",
      },
      {
        id: "08f4bc0f-099a-44ff-a913-66adcbc9d451",
        content: "A distinction that will comfort you and not the man in the cupboard.",
        sender: "John Stuart Mill",
        timestamp: "2025-03-11T07:55:22.000Z",
      },
      {
        id: "8bc64447-492d-4380-93cb-3ab5cc0c8810",
        content:
          "May I ask something. You have both said what you would do. Neither of you has said what a lie is.",
        sender: "Socrates",
        timestamp: "2025-03-11T07:56:01.000Z",
      },
      {
        id: "eb0723bb-4096-4fae-9758-f7c739f2a576",
        content: "A statement contrary to what one believes to be true.",
        sender: "Immanuel Kant",
        timestamp: "2025-03-11T07:56:20.000Z",
      },
      {
        id: "e4755321-b8ea-4c97-8ec9-14a443d568e8",
        content:
          "And if I say nothing at all, but arrange my face so that you believe the opposite of the truth. Have I lied?",
        sender: "Socrates",
        timestamp: "2025-03-11T07:56:52.000Z",
      },
      {
        id: "4451eb21-fafa-4ba5-9e99-67e8e4c91802",
        content: "No.",
        sender: "Immanuel Kant",
        timestamp: "2025-03-11T07:57:14.000Z",
      },
      {
        id: "9dbee1c1-24ec-4e47-a498-fbbed8f0aee4",
        content: "Then is it the lie you object to, or only the speaking of it?",
        sender: "Socrates",
        timestamp: "2025-03-11T07:57:33.000Z",
      },
      {
        id: "6333f151-054a-4821-8244-b2d58758e332",
        content: "I like him.",
        sender: "John Stuart Mill",
        timestamp: "2025-03-11T07:58:02.000Z",
      },
      {
        id: "40731efd-03b6-4f4a-8bef-dbd40970a099",
        content: "I do not.",
        sender: "Immanuel Kant",
        timestamp: "2025-03-11T07:58:09.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "me",
            timestamp: "2025-03-11T07:58:35.000Z",
          },
        ],
      },
    ],
  },
  {
    id: "7f1afc28-e427-4836-9627-59652beec8c8",
    recipients: [
      { id: "8ca2c28c-d34f-4bb3-b6f3-57676cd4b229", name: "Wendy Carlos" },
      { id: "99be0d9d-76a3-40ac-ac7e-a474ec72a2f2", name: "Amon Tobin" },
      { id: "bd874ce9-2ad8-4b65-800f-0fcff586db79", name: "Fred again.." },
    ],
    lastMessageTime: getTimeAgo(780),
    unreadCount: 2,
    messages: [
      {
        id: "2bbd0539-0b75-48d3-a01f-e6e1219eea65",
        content: "what's the most interesting sound you ever recorded",
        htmlContent: "<p>what's the most interesting sound you ever recorded</p>",
        sender: "me",
        timestamp: "2025-03-11T05:14:07.000Z",
      },
      {
        id: "ce909706-ef08-40ed-a4b3-4673496cff09",
        content:
          "A sheet of aluminium. I struck it once and slowed it down about four hundred times. There is a low end living in there that does not exist until you stretch it. Years of my records came out of objects like that.",
        sender: "Amon Tobin",
        timestamp: "2025-03-11T05:15:02.000Z",
      },
      {
        id: "1946ea89-38bb-4af2-83b5-e9318202f0d9",
        content:
          "I did not record sound so much as construct it. There was nothing to point a microphone at. We were soldering the thing that would make the note, and then it was monophonic, so I played every line one note at a time. Switched-On Bach took five months of that.",
        sender: "Wendy Carlos",
        timestamp: "2025-03-11T05:15:58.000Z",
      },
      {
        id: "1aa2c86a-386b-458f-8a08-3d76d65de5d1",
        content:
          "mine was my mate talking about how she was feeling. i had my phone out cos i always do. wasn't material at the time it was just a tuesday",
        sender: "Fred again..",
        timestamp: "2025-03-11T05:16:41.000Z",
      },
      {
        id: "dcbd26f9-661d-4570-9728-8d7fed5e9a65",
        content: "whole record came out of that. still not totally sure that was ok",
        sender: "Fred again..",
        timestamp: "2025-03-11T05:16:55.000Z",
      },
      {
        id: "d610ba49-1a5d-4d22-bc7d-26d3ab4a4ea5",
        content:
          "That question does not go away, and I would not trust anyone who told you it did.",
        sender: "Wendy Carlos",
        timestamp: "2025-03-11T05:17:30.000Z",
        reactions: [
          {
            type: "heart",
            sender: "Fred again..",
            timestamp: "2025-03-11T05:17:58.000Z",
          },
        ],
      },
      {
        id: "0423435f-6d35-4ebb-ae85-5753eec2f340",
        content: "The aluminium has never once asked me anything. Which is rather why I use aluminium.",
        sender: "Amon Tobin",
        timestamp: "2025-03-11T05:18:14.000Z",
      },
      {
        id: "baac6f33-d4ff-4945-a809-925b6e430ccb",
        content: "lol",
        sender: "Fred again..",
        timestamp: "2025-03-11T05:18:22.000Z",
      },
      {
        id: "c72f2a6d-b055-4481-b96f-7857eb82a2a3",
        content:
          "eno told me to keep the phone running and not think about it til later. reckon he was solving it for himself an all",
        sender: "Fred again..",
        timestamp: "2025-03-11T05:18:49.000Z",
      },
    ],
  },
  {
    id: "55e17b5f-b4a3-444d-9230-8cf190ca0928",
    recipients: [
      { id: "33b76bfb-f9b7-4fc3-8ff4-f083f9d013c3", name: "Ge Wang" },
      { id: "1a83252f-48c8-4914-8bc6-9cc7b94850b0", name: "Don Norman" },
      { id: "2d0e9683-efc7-44b5-9fcb-e38ea40d8dbd", name: "Grace Hopper" },
    ],
    lastMessageTime: getTimeAgo(1020),
    unreadCount: 0,
    messages: [
      {
        id: "f1e0582c-a20a-4826-9ca8-d90cbaae3552",
        content: "how do you explain something abstract to someone with no background in it",
        htmlContent: "<p>how do you explain something abstract to someone with no background in it</p>",
        sender: "me",
        timestamp: "2025-03-11T01:08:12.000Z",
      },
      {
        id: "dedd564a-5be3-47c1-8fbc-b035baca2609",
        content:
          "You put a piece of it in their hand. I carried wire cut to eleven point eight inches — the distance light travels in a nanosecond. Admirals who had nodded politely at me for an hour would go quiet holding it.",
        sender: "Grace Hopper",
        timestamp: "2025-03-11T01:09:03.000Z",
      },
      {
        id: "ea287c62-b4bb-42df-b995-1d7f961faddc",
        content:
          "The object makes the argument for you. That is why I spent a career on doors. Nobody accepts an abstract claim about affordances, but everyone has pushed a door that needed pulling and felt like an idiot. All I have to do is tell them it wasn't their fault.",
        sender: "Don Norman",
        timestamp: "2025-03-11T01:09:51.000Z",
      },
      {
        id: "9bcc603e-21f7-4ad1-bafb-b5d45cfc58ad",
        content: "And the second they believe it wasn't their fault, you have them. That's the whole opening.",
        sender: "Ge Wang",
        timestamp: "2025-03-11T01:10:19.000Z",
      },
      {
        id: "970cbef2-bc6a-489a-85a2-736a4d21666c",
        content:
          "I handed students an ocarina you blow into on a phone. Nobody needs a lecture about interface after that. It's already in their hands and they're a little embarrassed by how much they like it.",
        sender: "Ge Wang",
        timestamp: "2025-03-11T01:10:47.000Z",
      },
      {
        id: "b8b9a8e5-4d1e-4766-9e89-712d27e5a08c",
        content: "Does it work on the ones who tell you it can't be done?",
        sender: "Grace Hopper",
        timestamp: "2025-03-11T01:11:15.000Z",
      },
      {
        id: "3d0b8866-67b6-4883-8989-23c95538a47d",
        content: "Not always.",
        sender: "Ge Wang",
        timestamp: "2025-03-11T01:11:28.000Z",
      },
      {
        id: "01f3e046-0012-47ac-ac01-9f6268c7e759",
        content: "It never did for me either. I did it anyway and showed them afterward.",
        sender: "Grace Hopper",
        timestamp: "2025-03-11T01:11:49.000Z",
      },
      {
        id: "9fe8b8d7-e819-40e5-8e8c-47dd97f3175e",
        content: "That isn't teaching. That's revenge.",
        sender: "Don Norman",
        timestamp: "2025-03-11T01:12:06.000Z",
      },
      {
        id: "e6013371-2e13-4c25-bca3-115e21bf7196",
        content: "It is extremely effective.",
        sender: "Grace Hopper",
        timestamp: "2025-03-11T01:12:14.000Z",
        reactions: [
          {
            type: "laugh",
            sender: "Don Norman",
            timestamp: "2025-03-11T01:12:41.000Z",
          },
          {
            type: "laugh",
            sender: "Ge Wang",
            timestamp: "2025-03-11T01:12:48.000Z",
          },
        ],
      },
    ],
  },
  {
    id: "0498087a-627c-412e-b020-6e9192ad1937",
    recipients: [
      { id: "fee5e3f5-9242-4d22-97cb-052e940bb4b2", name: "Matty Matheson" },
      { id: "e9b9e137-075c-43b0-89ae-d6cd1e415a3b", name: "Anthony Bourdain" },
    ],
    lastMessageTime: getTimeAgo(1300),
    unreadCount: 0,
    messages: [
      {
        id: "b3f99f19-6f0a-40d5-9e03-491b1fd9944e",
        content: "matty what's the best thing you've eaten this week",
        htmlContent: "<p>matty what's the best thing you've eaten this week</p>",
        sender: "me",
        timestamp: "2025-03-10T20:36:44.000Z",
      },
      {
        id: "0dc8cb13-01cc-4b59-85b7-1efcdb0bc8ca",
        content:
          "A bologna sandwich. White bread, mustard, cut thick and fried till the edges curl up. I'm not being funny. I have eaten at the best restaurants on earth and I would take that sandwich.",
        sender: "Matty Matheson",
        timestamp: "2025-03-10T20:37:21.000Z",
      },
      {
        id: "77ce8be4-0317-4e28-9e4f-9bd0ad9a4a7d",
        content: "This is precisely why I trust you and almost nobody else in this business.",
        sender: "Anthony Bourdain",
        timestamp: "2025-03-10T20:37:49.000Z",
      },
      {
        id: "2f5f4643-8cbc-4fa1-b2aa-de91cb383c62",
        content:
          "It's my dad's thing. Cast iron he never once washed. Every chef I know has a dish like that and half of them won't say it out loud because it isn't French.",
        sender: "Matty Matheson",
        timestamp: "2025-03-10T20:38:30.000Z",
      },
      {
        id: "c40ddc6f-c2a2-4d2e-9366-191543da48a2",
        content: "The ones who won't say it are the ones you never let cook for you.",
        sender: "Anthony Bourdain",
        timestamp: "2025-03-10T20:38:55.000Z",
        reactions: [
          {
            type: "emphasize",
            sender: "Matty Matheson",
            timestamp: "2025-03-10T20:39:12.000Z",
          },
        ],
      },
      {
        id: "6f074777-b308-4acb-bb43-5f3c30b00fe1",
        content: "EXACTLY. Chef. That's it. That's the whole thing.",
        sender: "Matty Matheson",
        timestamp: "2025-03-10T20:39:20.000Z",
      },
      {
        id: "e6b7dc5b-5b93-4382-a900-aa909ea75342",
        content: "Send me the bologna.",
        sender: "Anthony Bourdain",
        timestamp: "2025-03-10T20:39:44.000Z",
      },
      {
        id: "0246c293-f672-46d0-9231-08c5b2e252d2",
        content: "I'll send you the pan.",
        sender: "Matty Matheson",
        timestamp: "2025-03-10T20:39:58.000Z",
      },
    ],
  },
];
