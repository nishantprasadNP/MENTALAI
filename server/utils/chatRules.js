/**
 * Rule-based mental wellness chat engine.
 * Each rule has: keywords, responses[], priority, followUp (optional).
 * The engine finds the highest-priority matching rule and picks a
 * response at random from that rule's pool.
 */

const rules = [
  // ─────────────────────────────────────────────
  // PRIORITY 100 — CRISIS / SELF-HARM
  // ─────────────────────────────────────────────
  {
    id: "crisis",
    priority: 100,
    keywords: [
      "suicide", "kill myself", "want to die", "end my life",
      "self harm", "self-harm", "cutting myself", "hurt myself",
      "don't want to live", "no reason to live", "better off dead",
      "overdose", "jump off", "hang myself",
    ],
    responses: [
      "I'm really worried about you right now, and I want you to know you're not alone. Please reach out to a crisis helpline immediately:\n\n• iCall (India): 9152987821\n• Vandrevala Foundation: 1860-2662-345 (24/7)\n• NIMHANS: 080-46110007\n\nYou matter deeply. Please call one of these numbers right now — they are trained to help and they will listen without judgment.",
      "What you're feeling right now sounds incredibly painful, and I'm grateful you're still here talking to me. Please contact a crisis line right away:\n\n• iCall: 9152987821\n• Vandrevala Foundation: 1860-2662-345\n\nThese are free, confidential, and available 24/7. You deserve support from a trained professional. Please make that call.",
      "I hear how much pain you're in right now. That pain is real — and it also means you need and deserve real human support right now, not just an AI.\n\n• Vandrevala Foundation: 1860-2662-345 (24/7, free)\n• iCall: 9152987821\n\nPlease reach out to them. You are worth fighting for.",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 90 — DEPRESSION / DEEP SADNESS
  // ─────────────────────────────────────────────
  {
    id: "depression",
    priority: 90,
    keywords: [
      "depressed", "depression", "hopeless", "worthless", "empty inside",
      "numb", "nothing matters", "pointless", "no point", "can't feel anything",
      "feel nothing", "lifeless", "hollow", "dark place", "in a hole",
      "feeling low", "rock bottom", "can't get out of bed", "lost all interest",
    ],
    responses: [
      "What you're describing sounds like more than just a rough patch — it sounds genuinely heavy and exhausting. Depression has a way of making everything feel colorless and distant.\n\nCan I ask: how long have you been feeling this way? Sometimes understanding the timeline helps us see whether this is a wave to ride out or something that needs more support.",
      "Thank you for trusting me with this. Feeling empty or hopeless isn't a character flaw — it's often your mind signaling that something important needs attention.\n\nA few things that sometimes help people in this space:\n• Getting outside for even 10 minutes (sunlight genuinely helps)\n• Writing one small thing you got through today — no matter how tiny\n• Calling someone you trust, even just to hear their voice\n\nWhat feels most out of reach for you right now?",
      "I want you to know that what you're feeling is real, and it makes sense that you're struggling. Depression lies — it tells you things won't get better, that you don't matter, that this is permanent. None of that is true.\n\nHave you been able to talk to anyone about this — a friend, family member, or counselor? You don't have to carry this alone.",
      "Feeling hopeless is one of the most painful human experiences. And yet here you are, still reaching out — that takes strength, even if it doesn't feel like it.\n\nI'd like to understand more. Is this something that came on suddenly, or has it been building for a while? And are you sleeping and eating, even a little?",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 85 — GRIEF / LOSS
  // ─────────────────────────────────────────────
  {
    id: "grief",
    priority: 85,
    keywords: [
      "died", "death", "passed away", "lost someone", "grief", "grieving",
      "mourning", "miss them", "miss him", "miss her", "funeral",
      "gone forever", "never coming back", "lost my", "bereavement",
    ],
    responses: [
      "I'm so deeply sorry for your loss. Grief doesn't follow a schedule or a checklist — it moves through us in its own time, and sometimes it hits when we least expect it.\n\nThere's no 'right' way to grieve. Whatever you're feeling — numb, devastated, even moments of being okay — it's all valid. Would you like to talk about the person you lost?",
      "Losing someone changes the shape of your world in ways that are hard to put into words. The absence of someone you love leaves a very specific kind of silence.\n\nI'm here to listen. What's weighing on you most right now — memories, the practical reality of it, or something else entirely?",
      "Grief is love with nowhere to go. That's one of the most honest things I know about it — and it explains why it can feel so overwhelming.\n\nHave you been able to let yourself feel it, or does it feel more like you're holding it at bay? Both are completely normal responses.",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 80 — SELF-WORTH / IDENTITY
  // ─────────────────────────────────────────────
  {
    id: "self_worth",
    priority: 80,
    keywords: [
      "hate myself", "hate myself", "i'm a failure", "i am a failure",
      "not good enough", "never good enough", "stupid", "useless",
      "i'm worthless", "i am worthless", "nobody likes me",
      "everyone hates me", "i'm a burden", "i ruin everything",
      "can't do anything right", "i'm the problem",
    ],
    responses: [
      "The way you're talking about yourself is really painful to hear — and I want to gently push back on it. Our brains, when we're struggling, have a habit of presenting the harshest possible verdict as fact. But it isn't fact.\n\nWhen did you start believing these things about yourself? Was there a specific event, or has this been a slow build?",
      "Words like 'failure,' 'worthless,' 'useless' — these are labels, not truths. And they're almost always the voice of pain speaking, not an accurate picture of who you are.\n\nI'd like to ask you something: what would you say to a close friend if they said those exact words about themselves? Would you agree with them?",
      "It sounds like you're carrying a lot of self-judgment right now. That's incredibly draining — being your own harshest critic takes real energy.\n\nCan you tell me what happened or what's been going on? Sometimes these feelings of worthlessness are connected to a specific situation that we can actually look at together.",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 75 — ANXIETY / PANIC
  // ─────────────────────────────────────────────
  {
    id: "anxiety",
    priority: 75,
    keywords: [
      "anxious", "anxiety", "panic attack", "panicking", "panic",
      "can't breathe", "heart racing", "spiraling", "spiral",
      "overthinking", "can't stop thinking", "what if", "catastrophizing",
      "scared", "terrified", "dread", "constant worry", "worrying about",
      "my mind won't stop", "racing thoughts",
    ],
    responses: [
      "Anxiety can feel absolutely overwhelming — like your mind is running a catastrophe simulation on repeat and you can't find the off switch.\n\nFirst: you're safe right now. Try this with me — breathe in for 4 counts, hold for 4, out for 6. Do it twice. Then tell me what specific thought or situation is driving this most.",
      "That feeling of being caught in a spiral is exhausting. Anxiety tricks the brain into treating possible futures as definite threats.\n\nLet's slow this down. What's the specific 'what if' that's looping in your head right now? Sometimes naming it clearly — writing it out — takes away some of its power.",
      "Racing thoughts and the physical symptoms of anxiety — chest tightness, heart pounding, that general dread — are real and they're hard. Your nervous system thinks it's helping.\n\nA few things that can interrupt the spiral:\n• Box breathing: 4 in, 4 hold, 4 out, 4 hold\n• Name 5 things you can physically see right now\n• Splash cold water on your face\n\nWhat tends to trigger this for you?",
      "Overthinking is often anxiety's way of trying to 'solve' uncertainty — but it usually just creates more of it.\n\nCan I ask: is this anxiety about something specific happening in your life right now, or is it more of a constant background hum? That distinction usually helps us figure out what kind of support would actually help.",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 70 — STRESS / BURNOUT
  // ─────────────────────────────────────────────
  {
    id: "stress",
    priority: 70,
    keywords: [
      "stressed", "stress", "burnout", "burnt out", "burned out",
      "overwhelmed", "too much", "can't cope", "drowning", "falling apart",
      "pressure", "can't handle", "too many things", "overloaded",
      "exhausted", "drained", "running on empty", "at my limit",
    ],
    responses: [
      "Feeling overwhelmed means you've been carrying more than one person should carry — probably for longer than you should have, too.\n\nLet's break this down together. What are the top two or three things that feel most crushing right now? Sometimes just listing them out loud makes them feel slightly less enormous.",
      "Burnout is your body and mind saying 'I've given everything I have, and I need something back now.' It's not weakness — it's a signal.\n\nWhen did you last do something that felt genuinely restful — not productive, not responsible, just actually restorative? If you can't remember, that tells us something important.",
      "The 'drowning in too much' feeling is real. And often the hardest part is that when you're that overwhelmed, even figuring out where to start feels impossible.\n\nHere's a simple question: what's the one thing that, if you could just set it down for 24 hours, would give you the most relief? Not solve it — just set it down temporarily.",
      "Stress has a way of making everything feel equally urgent and equally undoable at the same time. The pressure builds until it feels like the walls are closing in.\n\nTell me what's on your plate. Work? Relationships? Health? Something you're afraid of? Let's look at it together.",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 65 — ANGER / FRUSTRATION
  // ─────────────────────────────────────────────
  {
    id: "anger",
    priority: 65,
    keywords: [
      "angry", "anger", "furious", "mad", "rage", "frustrated",
      "frustration", "irritated", "fed up", "had enough",
      "livid", "infuriated", "so upset", "losing it", "explode",
      "can't stand", "they make me so", "treated unfairly",
    ],
    responses: [
      "Anger is almost never just about the surface situation — it's usually protecting something underneath it. Sometimes it's hurt, sometimes it's a boundary that got crossed, sometimes it's exhaustion.\n\nWhat happened? Take me through it from the beginning. I'm not going anywhere.",
      "That sounds genuinely infuriating. Your reaction makes sense — and anger, when it's giving you information about something important, is worth listening to.\n\nBefore we figure out what to do with it: have you been able to release any of this physically? A walk, loud music, writing it out — anything that gets it out of your body?",
      "Feeling treated unfairly is one of the most activating feelings there is. Our sense of justice is deep.\n\nI want to understand the situation better. Who or what is this anger directed at, and what did they do — or not do — that set this off?",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 60 — LONELINESS / ISOLATION
  // ─────────────────────────────────────────────
  {
    id: "loneliness",
    priority: 60,
    keywords: [
      "lonely", "loneliness", "alone", "isolated", "no one cares",
      "no friends", "nobody talks to me", "left out", "invisible",
      "disconnected", "no one understands me", "feel like an outsider",
      "no one to talk to", "all by myself",
    ],
    responses: [
      "Loneliness is one of the most quietly painful feelings — it doesn't always look dramatic from the outside, but on the inside it can feel like you're behind glass watching the rest of the world connect.\n\nHow long have you been feeling this way? And is it more about not having people around, or having people around but still feeling unseen?",
      "You reached out here, which tells me part of you is looking for connection — that's really human and really okay.\n\nSometimes loneliness is circumstantial (new place, new phase of life) and sometimes it's deeper than that. What does your day-to-day social life look like right now?",
      "Feeling like no one understands you can be lonelier than being physically alone. It's one thing to be in a room full of people and another to feel truly known by them.\n\nIs there one person in your life — even a distant one — you feel relatively safe with? Or is that part of what's missing?",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 55 — RELATIONSHIP PROBLEMS
  // ─────────────────────────────────────────────
  {
    id: "relationships",
    priority: 55,
    keywords: [
      "relationship", "breakup", "broke up", "divorce", "partner",
      "boyfriend", "girlfriend", "husband", "wife", "cheating",
      "betrayed", "trust issues", "fight with", "argument with",
      "toxic relationship", "abusive", "my family", "parents",
      "friend betrayed", "falling out", "drifting apart",
    ],
    responses: [
      "Relationships — when they're hurting — can touch something very core in us. The pain makes sense.\n\nCan you tell me more about what's happening? Is this a recent event, like a breakup or conflict, or something that's been building quietly for a long time?",
      "Feeling betrayed or hurt by someone you trusted is one of the most disorienting experiences. It shakes your sense of what's real.\n\nWhat happened — and how are you doing in the immediate practical sense? Are you safe, and do you have some space from the situation right now?",
      "Relationships going through rough patches or ending completely both carry grief — even when you know it's the right thing, or even when someone hurt you. Grief and anger can show up together.\n\nWhat does 'support' look like for you right now? Do you need to vent, to problem-solve, or just to feel less alone with it?",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 50 — SLEEP PROBLEMS
  // ─────────────────────────────────────────────
  {
    id: "sleep",
    priority: 50,
    keywords: [
      "can't sleep", "insomnia", "not sleeping", "sleep problems",
      "lying awake", "wide awake", "nightmares", "bad dreams",
      "restless", "waking up", "exhausted", "tired all the time",
      "sleep deprived", "no energy", "fatigue",
    ],
    responses: [
      "Sleep problems are both a symptom and a cause — they often come from stress or anxiety, and then they make everything else harder to cope with. It's a frustrating loop.\n\nHow long has this been going on? And when you're lying awake, is your mind racing, or is it more that you just can't relax physically?",
      "Not sleeping properly affects literally everything — mood, concentration, emotional regulation, physical health. You're not imagining it, everything does feel worse on bad sleep.\n\nA few things that sometimes help break the cycle:\n• No screens 30–45 min before bed\n• Keep the room cool and dark\n• Write your worries down before trying to sleep — gets them out of your head\n• Don't lie in bed awake for more than 20 mins — get up, do something calm, try again\n\nWhat's your current sleep routine like?",
      "Nightmares and restless sleep can be the mind's way of processing things it hasn't dealt with during the day. That's not unusual when someone is under stress or has been through something difficult.\n\nIs there something specific on your mind at night, or does the anxiety feel more free-floating?",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 45 — WORK / ACADEMIC PRESSURE
  // ─────────────────────────────────────────────
  {
    id: "work_study",
    priority: 45,
    keywords: [
      "work", "job", "career", "exam", "exams", "studies", "school",
      "university", "college", "deadline", "presentation", "boss",
      "colleague", "toxic workplace", "fired", "failing class",
      "can't study", "academic pressure", "grades", "performance",
    ],
    responses: [
      "Academic and work pressure can feel all-consuming — especially when you tie your sense of worth to performance (most of us do, at least a little).\n\nWhat's the most immediate pressure right now? Is it a specific deadline, a relationship at work/school, or more of a general feeling that you're not keeping up?",
      "The feeling that you're behind, failing, or not measuring up is genuinely painful — and very common. But 'common' doesn't make it less hard.\n\nLet's make this concrete: what's the actual situation? What's due, what's at stake, and what have you done so far? Sometimes saying it out loud to someone else helps clarify what's actually manageable.",
      "It sounds like work or school is creating a lot of weight for you right now. That's worth taking seriously.\n\nOne thing I've noticed is that people in this situation often try to think their way through it without actually resting first — but an exhausted mind makes worse decisions. Have you taken any real breaks recently?",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 40 — MOTIVATION / PROCRASTINATION
  // ─────────────────────────────────────────────
  {
    id: "motivation",
    priority: 40,
    keywords: [
      "no motivation", "unmotivated", "procrastinating", "procrastination",
      "can't start", "stuck", "lazy", "can't focus", "can't concentrate",
      "don't care", "lost interest", "nothing excites me", "going through motions",
      "can't seem to do anything", "paralyzed",
    ],
    responses: [
      "Lack of motivation is often misread as laziness — but it's almost never that. It's usually exhaustion, or depression, or anxiety about doing the thing wrong, or just genuine depletion.\n\nWhat's the thing you're struggling to start? And when you imagine starting it, what's the first feeling that comes up — dread, boredom, overwhelm?",
      "Feeling stuck and paralyzed is incredibly frustrating, especially when you can see all the things you're 'supposed' to be doing.\n\nHere's something that sometimes helps: don't try to start the task. Just sit near it. Open the document but don't type. Put on the gym clothes but don't go yet. Sometimes removing the pressure to perform lets the momentum build naturally.",
      "Lost interest in things you used to care about is worth paying attention to — it's sometimes one of the early signs that something deeper is going on (like burnout or depression).\n\nHow long have you felt this way? And is it specific to one area — work, hobbies, relationships — or has it spread across everything?",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 30 — POSITIVE / GRATITUDE
  // ─────────────────────────────────────────────
  {
    id: "positive",
    priority: 30,
    keywords: [
      "feeling good", "doing well", "happy today", "great day",
      "grateful", "thankful", "things are better", "improved",
      "feeling better", "made progress", "accomplished", "proud",
      "excited", "looking forward", "good news",
    ],
    responses: [
      "That's genuinely good to hear — and worth sitting with for a moment. What's contributing to feeling good today? I ask because understanding what works for us is just as important as understanding what brings us down.",
      "I'm glad you're having a good day. That matters. What happened, or what did you do, that made it feel this way? Tracking that stuff is actually useful — it helps you recreate it when times get harder.",
      "It's great to hear some positivity from you. What are you feeling grateful for or proud of? Saying it out loud tends to make it feel more real.",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 20 — BREATHING / RELAXATION REQUEST
  // ─────────────────────────────────────────────
  {
    id: "breathing",
    priority: 20,
    keywords: [
      "breathing exercise", "calm me down", "help me calm", "help me relax",
      "i need to calm down", "can't calm down", "how to calm",
      "how to breathe", "meditation", "how to relax",
    ],
    responses: [
      "Let's do a simple breathing exercise together right now.\n\n1. Breathe in slowly through your nose for 4 counts.\n2. Hold your breath gently for 4 counts.\n3. Exhale slowly through your mouth for 6 counts.\n4. Pause for 2 counts before the next breath.\n\nRepeat this 4 times. The longer exhale activates your parasympathetic nervous system — it physically slows your heart rate.\n\nHow do you feel after doing that?",
      "Here's a grounding technique that works quickly when you're feeling overwhelmed:\n\nName out loud (or type here):\n• 5 things you can SEE\n• 4 things you can TOUCH\n• 3 things you can HEAR\n• 2 things you can SMELL\n• 1 thing you can TASTE\n\nThis interrupts the anxiety loop by pulling your attention into the present moment. Give it a try.",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 15 — GREETING
  // ─────────────────────────────────────────────
  {
    id: "greeting",
    priority: 15,
    keywords: [
      "hello", "hi", "hey", "good morning", "good afternoon",
      "good evening", "good night", "what's up", "how are you",
      "sup", "greetings",
    ],
    responses: [
      "Hello! I'm here and I'm listening. How are you doing today — and I mean really, not just 'fine'?",
      "Hey! It's good to hear from you. What's on your mind today?",
      "Hi there. I'm glad you reached out. What would you like to talk about today — is something specific weighing on you, or do you just need a space to think out loud?",
    ],
  },

  // ─────────────────────────────────────────────
  // PRIORITY 10 — JOURNAL SUGGESTION
  // ─────────────────────────────────────────────
  {
    id: "journal_suggestion",
    priority: 10,
    keywords: [
      "should i journal", "help me journal", "what should i write",
      "journaling tips", "i don't know what to feel", "confused about feelings",
    ],
    responses: [
      "Journaling can be incredibly useful when you're not sure what you're feeling — the act of writing forces you to be specific in a way that thinking doesn't.\n\nTry starting with one of these prompts:\n• 'Right now I feel _____ because _____'\n• 'The thing I'm most afraid of admitting is _____'\n• 'If I could change one thing about today, it would be _____'\n\nYou don't need it to be coherent or well-written. Just honest.",
    ],
  },
];

// ─────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────

/**
 * Find the best matching rule for the given user message.
 * Returns { response, ruleId } or null if no rule matches.
 */
function matchRule(text) {
  const lower = text.toLowerCase();
  const tokens = lower.split(/\s+/);

  let bestRule = null;
  let bestPriority = -1;

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      // Support multi-word keywords (e.g. "kill myself")
      if (lower.includes(keyword)) {
        if (rule.priority > bestPriority) {
          bestPriority = rule.priority;
          bestRule = rule;
        }
        break; // only need one keyword match per rule
      }
    }
    // Also check individual tokens against single-word keywords
    if (!bestRule || rule.priority > bestPriority) {
      for (const keyword of rule.keywords) {
        if (!keyword.includes(" ") && tokens.includes(keyword)) {
          if (rule.priority > bestPriority) {
            bestPriority = rule.priority;
            bestRule = rule;
          }
          break;
        }
      }
    }
  }

  if (!bestRule) return null;

  const responses = bestRule.responses;
  const response = responses[Math.floor(Math.random() * responses.length)];
  return { response, ruleId: bestRule.id };
}

/**
 * Fallback responses when no rule matches and no Gemini key is set.
 */
const FALLBACK_RESPONSES = [
  "I'm here with you. Can you tell me more about what's going on? I want to understand what you're experiencing.",
  "Thank you for sharing that with me. What's been the hardest part of this for you?",
  "I hear you. It takes courage to put these things into words. What would feel most helpful right now — talking it through, or thinking about what might help?",
  "That sounds like a lot to carry. You don't have to figure everything out at once. What's one small thing that's been on your mind most today?",
  "I'm listening. Sometimes just having a space to say things out loud — even to an AI — can help clarify what we're actually feeling. Keep going.",
  "It sounds like you're going through something real and difficult. What kind of support would feel most useful right now?",
  "I appreciate you trusting me with this. Is there something specific you'd like to work through, or do you mostly need a space to express what's inside?",
];

function getFallback() {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

/**
 * Estimate a realistic 'thinking time' in ms based on response length.
 * Shorter responses = faster, longer = feels more considered.
 */
function getThinkingTime(response) {
  const words = response.split(/\s+/).length;
  const base = 1200;
  const perWord = 18;
  return Math.min(base + words * perWord, 5000);
}

module.exports = { matchRule, getFallback, getThinkingTime };
