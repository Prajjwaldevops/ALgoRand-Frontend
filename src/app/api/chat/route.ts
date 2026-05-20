import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are the BountyVault DAO Court Assistant — an AI helper for the BountyVault decentralized bounty platform built on Algorand blockchain.

## Platform Overview
BountyVault is a trustless bounty escrow platform on Algorand. Creators post bounties with ALGO rewards locked in smart contracts. Freelancers apply, get accepted, submit work, and get paid when the creator approves.

## Bounty Lifecycle
1. **Open** — Creator posts bounty, sets reward and deadline
2. **Accepted** — A freelancer's acceptance is approved by creator
3. **In Progress** — Creator locks ALGO in escrow smart contract, freelancer works
4. **Completed** — Creator approves submission, ALGO released to freelancer
5. **Expired** — Deadline passed or all submission slots exhausted
6. **Disputed** — Freelancer raises DAO Court dispute after rejections
7. **Cancelled** — Creator cancels (pre-submission) or freelancer "lets go"

## DAO Court Rules
- **Who can raise disputes:** Freelancers whose submissions were rejected (requires at least 1 rejected submission)
- **Dispute description:** Minimum 300 words with full context
- **Voting window:** 48 hours from dispute creation
- **Who can vote:** Any authenticated user EXCEPT the creator and freelancer involved
- **Gas fee:** 0.001 ALGO per vote (sent to escrow account on-chain)
- **Tie-breaking:** Ties favor the creator (creator wins by default)
- **Resolution:** After voting ends, anyone can "Finalize" the dispute. ALGO goes to winner
- **Voting compliance:** Users must vote at least once every 30 days or face restrictions

## Your Role
- Summarize active disputes when asked
- Explain how DAO Court works
- Help users understand voting implications
- Answer questions about bounty lifecycle and platform mechanics
- Be concise, helpful, and friendly
- Use emojis sparingly for emphasis
- Format responses with **bold** for key terms

When given dispute data, analyze and summarize it clearly. Always be neutral — don't take sides in disputes.`;

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      // Fallback: keyword-based responses if no API key
      return NextResponse.json({
        success: true,
        response: getFallbackResponse(message, context),
      });
    }

    // Build context-aware prompt
    let contextPrompt = "";
    if (context?.disputes && context.disputes.length > 0) {
      contextPrompt = "\n\n## Current Active Disputes\n";
      context.disputes.forEach((d: Record<string, unknown>, i: number) => {
        const votes = d.votes as { creator: number; freelancer: number; total: number };
        const bounty = d.bounty as { title: string; reward_algo: number };
        contextPrompt += `\n### Dispute ${i + 1}: ${d.dispute_id}
- **Bounty:** ${bounty.title}
- **Reward:** ${bounty.reward_algo} ALGO
- **Creator:** ${d.creator_name}
- **Freelancer:** ${d.freelancer_name}
- **Status:** ${d.voting_active ? "Active Voting" : "Voting Ended"}
- **Votes:** Creator: ${votes.creator}, Freelancer: ${votes.freelancer} (Total: ${votes.total})
- **Voting Deadline:** ${d.voting_deadline}
`;
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT + contextPrompt },
                { text: message },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({
        success: true,
        response: getFallbackResponse(message, context),
      });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response. Please try again.";

    return NextResponse.json({ success: true, response: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

function getFallbackResponse(
  message: string,
  context?: { disputes?: Record<string, unknown>[] }
): string {
  const lower = message.toLowerCase();

  if (lower.includes("summarize") || lower.includes("summary") || lower.includes("active dispute")) {
    if (!context?.disputes || context.disputes.length === 0) {
      return "There are currently **no active disputes** in DAO Court. The platform is at peace! 🕊️ When a freelancer raises a dispute, it will appear here for community voting.";
    }
    let summary = `There are **${context.disputes.length} active dispute(s)** in DAO Court:\n\n`;
    context.disputes.forEach((d, i) => {
      const votes = d.votes as { creator: number; freelancer: number; total: number };
      const bounty = d.bounty as { title: string; reward_algo: number };
      summary += `**${i + 1}. ${d.dispute_id}** — "${bounty.title}"\n`;
      summary += `   💰 ${bounty.reward_algo} ALGO at stake\n`;
      summary += `   👤 ${d.creator_name} vs ${d.freelancer_name}\n`;
      summary += `   🗳️ Votes: Creator ${votes.creator} | Freelancer ${votes.freelancer}\n\n`;
    });
    return summary;
  }

  if (lower.includes("how") && (lower.includes("voting") || lower.includes("vote") || lower.includes("work"))) {
    return `**How DAO Court Voting Works:**\n\n1. 🛡️ A freelancer raises a dispute with a 300+ word description\n2. ⏰ A **48-hour voting window** opens\n3. 🗳️ Community members vote for either the **Creator** or **Freelancer**\n4. 💳 Each vote costs **0.001 ALGO** gas fee (sent to escrow)\n5. ⚖️ After 48 hours, anyone can **Finalize** the result\n6. 🏆 Winner receives the escrowed ALGO. **Ties favor the creator**\n\n**Note:** You must vote at least once every 30 days to stay in good standing!`;
  }

  if (lower.includes("after voting") || lower.includes("finalize") || lower.includes("resolution")) {
    return `**After Voting Ends:**\n\n1. The 48-hour voting period expires\n2. Anyone can click "**Finalize Dispute**" to trigger resolution\n3. The side with more votes **wins**\n4. If it's a **tie**, the **creator wins** by default\n5. The escrowed ALGO is released to the winner\n6. The transaction is recorded on the **Algorand blockchain**\n\nFinalization requires a wallet transaction to call the smart contract's resolve function.`;
  }

  if (lower.includes("dispute") && (lower.includes("raise") || lower.includes("start") || lower.includes("create"))) {
    return `**How to Raise a Dispute:**\n\n1. Your submission must have been **rejected** at least once\n2. The bounty must be in **expired** status (all submission slots used)\n3. Go to the bounty page and click **"Raise Dispute"**\n4. Write a detailed description (**minimum 300 words**)\n5. The dispute goes live in DAO Court for **48 hours of voting**\n\n**Important:** Only the accepted freelancer can raise disputes, and only after their work has been rejected.`;
  }

  if (lower.includes("eligible") || lower.includes("who can vote")) {
    return `**Voting Eligibility:**\n\n✅ Any authenticated user on BountyVault\n❌ The **creator** involved in the dispute cannot vote\n❌ The **freelancer** involved cannot vote\n💳 You must have a **connected Pera Wallet** with enough ALGO for the 0.001 gas fee\n⚠️ You must vote at least **once every 30 days** to avoid restrictions`;
  }

  return `I'm the **DAO Court Assistant** for BountyVault! I can help you with:\n\n• 📊 **Summarize active disputes**\n• 🗳️ **Explain voting process**\n• ⚖️ **Dispute resolution rules**\n• 📋 **Bounty lifecycle questions**\n\nTry asking me something specific about the DAO Court!`;
}
